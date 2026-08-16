'use client';

import { useMemo, useRef, useState } from 'react';

import { sankey, sankeyJustify } from 'd3-sankey';

import { CoinIcon } from '@repo/common/components';
import { Skeleton, cn, useResizeObserver } from '@repo/ui';

import { getSwapProvider } from './providerRegistry';
import {
  alignRouteNodeLinkAnchors,
  buildRouteGraph,
  buildRouteGraphLayoutModel,
  distributeDirectRouteLanes,
  formatRouteTokenFallbackLabel,
  getRouteGraphBypassLaneY,
  getRouteGraphColumnBounds,
  getRouteGraphContentHeight,
  getRouteGraphLinkPath,
  getRouteGraphLayoutHeight,
  getRouteGraphNodeWidth,
  getRouteGraphNodeHeight,
  getRouteProviderColorMap,
  getRouteGraphViewportHeight,
  ROUTE_GRAPH_LAYOUT_NODE_PADDING,
  ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT,
  ROUTE_GRAPH_NODE_GAP,
  sortRouteGraphLinksForDisplay,
  spreadRouteEndpointAnchors,
} from './routeGraph';
import type {
  RouteGraphLink,
  RouteGraphLayoutLink,
  RouteGraphLayoutNode,
  RouteGraphModel,
  RouteGraphNode,
  RouteNodeLinkAnchor,
} from './routeGraph';
import type { RouteTokenLoadStatus } from './useRouteTokens';
import type { SwapToken } from './useSwapTokens';
import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

const GRAPH_WIDTH = 661;
const ENDPOINT_SIDE_GAP = 0;
const ENDPOINT_NODE_WIDTH = 36;
const TOOLTIP_WIDTH = 250;
const TOOLTIP_HEIGHT = 96;

type PositionedNode = RouteGraphNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PositionedLink = RouteGraphLink & {
  pathId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

type RouteGraphLayout = {
  contentHeight: number;
  viewportHeight: number;
  nodes: PositionedNode[];
  links: PositionedLink[];
};

type D3NodeExtra = RouteGraphLayoutNode;
type D3LinkExtra = Omit<RouteGraphLayoutLink, 'source' | 'target'>;

const formatPercentage = (percentageBps: number) =>
  `${(percentageBps / 100).toFixed(2).replace(/\.?0+$/, '')}%`;

const getRouteSankeyLayout = (
  model: RouteGraphModel,
  graphWidth: number,
): RouteGraphLayout => {
  const contentHeight = getRouteGraphContentHeight(
    model,
    0,
    ROUTE_GRAPH_NODE_GAP,
    ROUTE_GRAPH_LAYOUT_NODE_PADDING,
  );
  const viewportHeight = getRouteGraphViewportHeight(
    contentHeight,
    ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT,
  );

  if (model.nodes.length === 0 || model.maxDepth === 0) {
    return {
      contentHeight,
      viewportHeight,
      nodes: [],
      links: [],
    };
  }

  const layoutModel = buildRouteGraphLayoutModel(model);
  const tokenNodeWidth = getRouteGraphNodeWidth(
    graphWidth,
    model.maxDepth,
    ENDPOINT_SIDE_GAP,
  );
  const layoutHeight = getRouteGraphLayoutHeight(
    model,
    ROUTE_GRAPH_LAYOUT_NODE_PADDING,
  );
  const layoutTop = Math.max(0, (contentHeight - layoutHeight) / 2);
  const d3Graph = sankey<D3NodeExtra, D3LinkExtra>()
    .nodeId((node) => node.id)
    .nodeAlign(sankeyJustify)
    .nodeWidth(tokenNodeWidth)
    .nodePadding(ROUTE_GRAPH_LAYOUT_NODE_PADDING)
    .extent([
      [ENDPOINT_SIDE_GAP, layoutTop],
      [graphWidth - ENDPOINT_SIDE_GAP, layoutTop + layoutHeight],
    ])({
    nodes: layoutModel.nodes.map((node) => ({ ...node })),
    links: layoutModel.links.map((link) => ({ ...link })),
  });

  const d3NodesById = new Map(d3Graph.nodes.map((node) => [node.id, node]));
  const routeLinksById = new Map(model.links.map((link) => [link.id, link]));
  const getHorizontalBounds = (node: (typeof d3Graph.nodes)[number]) =>
    getRouteGraphColumnBounds(
      graphWidth,
      model.maxDepth,
      node.depth ?? 0,
      tokenNodeWidth,
      ENDPOINT_NODE_WIDTH,
      ENDPOINT_SIDE_GAP,
    );
  const nodes = model.nodes.map((node): PositionedNode => {
    const d3Node = d3NodesById.get(node.id)!;
    const flowTop = d3Node.y0 ?? 0;
    const flowBottom = d3Node.y1 ?? flowTop;
    const height = getRouteGraphNodeHeight(node.id, model.links);
    const horizontalBounds = getHorizontalBounds(d3Node);

    return {
      ...node,
      x: horizontalBounds.x,
      y: (flowTop + flowBottom - height) / 2,
      width: horizontalBounds.width,
      height,
    };
  });
  const positionedNodesById = new Map(nodes.map((node) => [node.id, node]));
  const routeNodesById = new Map(model.nodes.map((node) => [node.id, node]));
  const directRouteLanes = model.links.flatMap((link) =>
    routeNodesById.get(link.source)?.depth === 0 &&
    routeNodesById.get(link.target)?.depth === model.maxDepth
      ? [
          {
            id: `link:${link.id}`,
            order: link.streamIndexes[0] ?? 0,
            strokeWidth: link.strokeWidth,
          },
        ]
      : [],
  );
  const directLaneYByLinkId = distributeDirectRouteLanes(
    directRouteLanes,
    nodes.filter((node) => node.depth > 0 && node.depth < model.maxDepth),
    contentHeight,
  );
  const nodeAnchorYById = new Map<string, number>();

  nodes.forEach((node) => {
    if (node.depth === 0 || node.depth === model.maxDepth) return;

    const alignedAnchors = alignRouteNodeLinkAnchors(
      d3Graph.links.flatMap<RouteNodeLinkAnchor>((link) => {
        const source =
          typeof link.source === 'object'
            ? link.source
            : d3NodesById.get(String(link.source))!;
        const target =
          typeof link.target === 'object'
            ? link.target
            : d3NodesById.get(String(link.target))!;
        const routeLink = routeLinksById.get(link.routeLinkId)!;
        const sourceNode = positionedNodesById.get(String(source.id));
        const targetNode = positionedNodesById.get(String(target.id));

        if (source.id === node.id) {
          return [
            {
              id: `source:${link.id}`,
              desiredY: link.y0 ?? 0,
              providerCode: routeLink.providerCode,
              side: 'outgoing' as const,
              sortY:
                targetNode !== undefined && targetNode.depth < model.maxDepth
                  ? targetNode.y + targetNode.height / 2
                  : node.y + node.height / 2,
              streamIndexes: routeLink.streamIndexes,
              strokeWidth: link.width ?? routeLink.strokeWidth,
            },
          ];
        }

        if (target.id === node.id) {
          return [
            {
              id: `target:${link.id}`,
              desiredY: link.y1 ?? 0,
              providerCode: routeLink.providerCode,
              side: 'incoming' as const,
              sortY:
                sourceNode !== undefined && sourceNode.depth > 0
                  ? sourceNode.y + sourceNode.height / 2
                  : (link.y0 ?? 0),
              streamIndexes: routeLink.streamIndexes,
              strokeWidth: link.width ?? routeLink.strokeWidth,
            },
          ];
        }

        return [];
      }),
      node.y,
      node.height,
    );

    alignedAnchors.forEach((y, id) => nodeAnchorYById.set(id, y));
  });
  const sourceAnchorYByLinkId = spreadRouteEndpointAnchors(
    d3Graph.links.flatMap((link) => {
      const source =
        typeof link.source === 'object'
          ? link.source
          : d3NodesById.get(String(link.source))!;

      return source.depth === 0
        ? [
            {
              id: link.id,
              desiredY:
                directLaneYByLinkId.get(link.id) ??
                nodeAnchorYById.get(`target:${link.id}`) ??
                link.y1 ??
                0,
              strokeWidth: link.width ?? 0,
            },
          ]
        : [];
    }),
    contentHeight,
  );
  const targetAnchorYByLinkId = spreadRouteEndpointAnchors(
    d3Graph.links.flatMap((link) => {
      const source =
        typeof link.source === 'object'
          ? link.source
          : d3NodesById.get(String(link.source))!;
      const target =
        typeof link.target === 'object'
          ? link.target
          : d3NodesById.get(String(link.target))!;
      const sourceBounds = getHorizontalBounds(source);
      const targetBounds = getHorizontalBounds(target);

      const sourceY = nodeAnchorYById.get(`source:${link.id}`) ?? link.y0 ?? 0;

      return target.depth === model.maxDepth
        ? [
            {
              id: link.id,
              desiredY:
                directLaneYByLinkId.get(link.id) ??
                getRouteGraphBypassLaneY(
                  {
                    source: source.id,
                    target: target.id,
                    sourceX: sourceBounds.x + sourceBounds.width,
                    sourceY,
                    targetX: targetBounds.x,
                    targetY: sourceY,
                    strokeWidth: link.width ?? 0,
                  },
                  nodes,
                  contentHeight,
                ) ??
                sourceY,
              strokeWidth: link.width ?? 0,
            },
          ]
        : [];
    }),
    contentHeight,
  );

  return {
    contentHeight,
    viewportHeight,
    nodes,
    links: d3Graph.links.map((link): PositionedLink => {
      const routeLink = routeLinksById.get(link.routeLinkId)!;
      const source =
        typeof link.source === 'object'
          ? link.source
          : d3NodesById.get(String(link.source))!;
      const target =
        typeof link.target === 'object'
          ? link.target
          : d3NodesById.get(String(link.target))!;
      const sourceBounds = getHorizontalBounds(source);
      const targetBounds = getHorizontalBounds(target);

      return {
        ...routeLink,
        pathId: link.id,
        strokeWidth: link.width ?? routeLink.strokeWidth,
        sourceX: sourceBounds.x + sourceBounds.width,
        sourceY:
          sourceAnchorYByLinkId.get(link.id) ??
          nodeAnchorYById.get(`source:${link.id}`) ??
          link.y0 ??
          0,
        targetX: targetBounds.x,
        targetY:
          targetAnchorYByLinkId.get(link.id) ??
          nodeAnchorYById.get(`target:${link.id}`) ??
          link.y1 ??
          0,
      };
    }),
  };
};

const ProviderTooltip = ({
  link,
  tokenByAddress,
  color,
  x,
  y,
}: {
  link: PositionedLink;
  tokenByAddress: Record<string, SwapToken>;
  color: string;
  x: number;
  y: number;
}) => {
  const provider = getSwapProvider(link.providerCode);
  const ProviderIcon = provider.Icon;
  const sourceToken =
    tokenByAddress[link.source.slice(link.source.indexOf(':') + 1)];
  const targetToken =
    tokenByAddress[link.target.slice(link.target.indexOf(':') + 1)];

  return (
    <div
      className="border-bg-7 bg-bg-4 pointer-events-none absolute z-20 flex w-[250px] flex-col gap-2 rounded-2xl border p-3 shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between gap-3 text-base/[1.2]">
        <span className="inline-flex min-w-0 items-center gap-2">
          {ProviderIcon ? (
            <ProviderIcon size={20} className="shrink-0" />
          ) : (
            <span
              className="size-5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="truncate">{provider.displayName}</span>
        </span>
        <span className="shrink-0">{formatPercentage(link.percentageBps)}</span>
      </div>
      <div className="text-t-350 flex items-center justify-between gap-3 text-xs">
        <span>Trading pair</span>
        <span className="truncate">
          {sourceToken?.symbol ?? '—'}/{targetToken?.symbol ?? '—'}
        </span>
      </div>
    </div>
  );
};

export const RouteSankeyGraph = ({
  streams,
  tokenByAddress,
  statusByAddress,
  constrained = false,
}: {
  streams: ExternalSwapRouteStream[];
  tokenByAddress: Record<string, SwapToken>;
  statusByAddress: Record<string, RouteTokenLoadStatus>;
  constrained?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(GRAPH_WIDTH);
  const resizeRef = useResizeObserver<HTMLDivElement>((entry) => {
    const nextWidth = Math.round(entry.contentRect.width);

    setGraphWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  });
  const model = useMemo(() => buildRouteGraph(streams), [streams]);
  const layout = useMemo(
    () => getRouteSankeyLayout(model, graphWidth),
    [graphWidth, model],
  );
  const providerColors = useMemo(
    () => getRouteProviderColorMap(model.providerCodes),
    [model.providerCodes],
  );
  const displayLinks = useMemo(
    () => sortRouteGraphLinksForDisplay(layout.links),
    [layout.links],
  );
  const [hoveredLinkId, setHoveredLinkId] = useState<string>();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const hoveredLink = layout.links.find((link) => link.id === hoveredLinkId);
  const endpointNodes = layout.nodes.filter(
    (node) => node.depth === 0 || node.depth === model.maxDepth,
  );

  const updateTooltipPosition = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltipPosition({
      x: Math.min(
        graphWidth - TOOLTIP_WIDTH - 8,
        Math.max(8, clientX - rect.left + 12),
      ),
      y: Math.min(
        Math.max(8, layout.viewportHeight - TOOLTIP_HEIGHT - 8),
        Math.max(8, clientY - rect.top + 12),
      ),
    });
  };

  return (
    <div
      ref={resizeRef}
      className={cn(
        'flex w-full min-w-0 flex-col gap-3',
        constrained && 'min-h-0 flex-1',
      )}
    >
      <div
        ref={containerRef}
        className={cn('relative w-full', constrained && 'min-h-0 flex-1')}
        style={{ height: layout.viewportHeight }}
        onPointerLeave={() => setHoveredLinkId(undefined)}
      >
        <div className="scrollbar-none h-full overflow-x-hidden overflow-y-auto">
          <div
            className="relative"
            style={{ width: graphWidth, height: layout.contentHeight }}
          >
            <svg
              className="absolute inset-0"
              width={graphWidth}
              height={layout.contentHeight}
              viewBox={`0 0 ${graphWidth} ${layout.contentHeight}`}
              role="img"
              aria-label="Swap route graph"
            >
              <g>
                {displayLinks.map((link) => {
                  const dimmed =
                    hoveredLinkId !== undefined && hoveredLinkId !== link.id;

                  return (
                    <path
                      key={link.pathId}
                      d={getRouteGraphLinkPath(
                        link,
                        layout.nodes,
                        layout.contentHeight,
                      )}
                      fill="none"
                      stroke={providerColors[link.providerCode]}
                      strokeWidth={link.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={dimmed ? 0.12 : 1}
                      className="transition-opacity duration-150"
                      onPointerEnter={(event) => {
                        setHoveredLinkId(link.id);
                        updateTooltipPosition(event.clientX, event.clientY);
                      }}
                      onPointerMove={(event) =>
                        updateTooltipPosition(event.clientX, event.clientY)
                      }
                    />
                  );
                })}
              </g>
            </svg>

            {layout.nodes.map((node) => {
              if (node.depth === 0 || node.depth === model.maxDepth) {
                return null;
              }

              const token = tokenByAddress[node.address];
              const tokenStatus = statusByAddress[node.address];
              const adjacentToHoveredLink =
                !hoveredLink ||
                hoveredLink.source === node.id ||
                hoveredLink.target === node.id;
              const horizontalPadding = node.width < 80 ? 8 : 16;

              return (
                <div
                  key={node.id}
                  className="pointer-events-none absolute z-10 flex items-center gap-1 overflow-hidden rounded-lg border border-white/10 bg-black/20 text-xs backdrop-blur-[20px] transition-opacity duration-150"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                    paddingInline: horizontalPadding,
                    opacity: adjacentToHoveredLink ? 1 : 0.34,
                  }}
                >
                  {token ? (
                    <>
                      <CoinIcon
                        src={token.logoURI}
                        alt={token.symbol}
                        size={20}
                      />
                      <span className="truncate">{token.symbol}</span>
                    </>
                  ) : tokenStatus === 'error' ? (
                    <>
                      <CoinIcon size={20} className="shrink-0" />
                      <span className="min-w-0 truncate">
                        {formatRouteTokenFallbackLabel(node.address)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Skeleton className="bg-bg-7 size-5 shrink-0 rounded-full" />
                      <Skeleton className="bg-bg-7 h-3 min-w-0 flex-1 rounded-sm" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {endpointNodes.map((node) => {
          const token = tokenByAddress[node.address];

          return (
            <div
              key={node.id}
              className="pointer-events-none absolute top-0 z-10 flex h-full items-center justify-center rounded-lg border border-white/10 bg-black/20 backdrop-blur-[20px]"
              style={{ left: node.x, width: node.width }}
            >
              {token ? (
                <CoinIcon src={token.logoURI} alt={token.symbol} size={20} />
              ) : (
                <span className="bg-bg-7 size-5 rounded-full" />
              )}
            </div>
          );
        })}

        {hoveredLink ? (
          <ProviderTooltip
            link={hoveredLink}
            tokenByAddress={tokenByAddress}
            color={providerColors[hoveredLink.providerCode]!}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {model.providerCodes.map((providerCode) => (
          <span
            key={providerCode}
            className="text-t-350 inline-flex items-center gap-1 text-[11px]/[1.2]"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: providerColors[providerCode] }}
            />
            {getSwapProvider(providerCode).displayName}
          </span>
        ))}
      </div>
    </div>
  );
};
