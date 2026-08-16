'use client';

import {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Trans } from '@lingui/react/macro';
import { cn } from '@repo/ui';
import { useReferralNetwork, type ReferralNetworkNode } from '@/common/hooks';

type GraphNodeKind = 'you' | 'l1' | 'l2' | 'l2-others' | 'l1-others';

type GraphConfig = {
  width: number;
  height: number;
  centerX?: number;
  centerY?: number;
  r1: number;
  r2: number;
  sizeCenter: number;
  sizeL1: number;
  sizeL2: number;
  spread: number;
  fontSize: number;
  labelOffset: number;
  legendWidth: number;
  cardRadius: string;
  innerGlow: number;
  l0OuterSize: number;
  l0InnerSize: number;
};

type RenderedNode = {
  id: string;
  kind: GraphNodeKind;
  x: number;
  y: number;
  size: number;
  label: string;
  sub?: string;
  parentId?: string;
  labelSide?: 'bottom' | 'bottom-right' | 'left' | 'right';
  floatDx: number;
  floatDy: number;
  floatDuration: number;
  floatDelay: number;
};

type RenderedEdge = {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  kind: 'l1' | 'l2';
  fromId: string;
  toId: string;
};

const DESKTOP_CONFIG: GraphConfig = {
  width: 1048,
  height: 600,
  r1: 150,
  r2: 235,
  sizeCenter: 132,
  sizeL1: 66,
  sizeL2: 57,
  spread: 19,
  fontSize: 14,
  labelOffset: 8,
  legendWidth: 183,
  cardRadius: '1rem',
  innerGlow: 460,
  l0OuterSize: 160,
  l0InnerSize: 120,
};

const MOBILE_CONFIG: GraphConfig = {
  width: 311,
  height: 267,
  centerX: 155,
  centerY: 143,
  r1: 70,
  r2: 125,
  sizeCenter: 63,
  sizeL1: 31,
  sizeL2: 27,
  spread: 20,
  fontSize: 10,
  labelOffset: 6,
  legendWidth: 228,
  cardRadius: '0',
  innerGlow: 218,
  l0OuterSize: 76,
  l0InnerSize: 57,
};

const NETWORK_LINE_STROKE = 'rgba(191,207,255,0.10)';
const NO_FLOAT = {
  floatDx: 0,
  floatDy: 0,
  floatDuration: 0,
  floatDelay: 0,
};

function polar(cx: number, cy: number, radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function pointToward(
  from: { x: number; y: number },
  to: { x: number; y: number },
  offset: number,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (!length) return from;

  return {
    x: from.x + (dx / length) * offset,
    y: from.y + (dy / length) * offset,
  };
}

function formatNodeAddress(address: string) {
  if (address.length <= 8) return address;

  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getFloatMotion(seed: number) {
  const dx = ((seed % 5) - 2) * 0.8;
  const dy = (((seed * 3) % 5) - 2) * 0.8;
  return {
    floatDx: dx,
    floatDy: dy,
    floatDuration: 5.5 + (seed % 4) * 0.6,
    floatDelay: (seed % 6) * 0.2,
  };
}

function getChildAngleOffsets(count: number, spread: number) {
  if (count <= 0) return [];
  if (count === 1) return [0];

  const range = count > 2 ? spread * 1.5 : spread;
  const step = (range * 2) / (count - 1);

  return Array.from({ length: count }, (_, index) => -range + step * index);
}

const MOBILE_L1_SLOTS = [
  { x: 154.7, y: 73.26 },
  { x: 225.55, y: 142.69 },
  { x: 84.26, y: 142.69 },
  { x: 154.7, y: 214.52 },
];

const MOBILE_L2_SLOTS = [
  [
    { x: 132.22, y: 33.89, labelSide: 'left' as const },
    { x: 177.17, y: 33.89, labelSide: 'right' as const },
  ],
  [
    { x: 261.37, y: 119.52, labelSide: 'bottom-right' as const },
    { x: 261.37, y: 166.14, labelSide: 'bottom-right' as const },
  ],
  [
    { x: 48.49, y: 119.52, labelSide: 'right' as const },
    { x: 48.49, y: 166.14, labelSide: 'right' as const },
  ],
  [{ x: 154.81, y: 253.2, labelSide: 'right' as const }],
];

function buildMobileGraph(
  config: GraphConfig,
  networkNodes: ReferralNetworkNode[],
) {
  const cx = config.centerX ?? config.width / 2;
  const cy = config.centerY ?? config.height / 2;
  const nodes: RenderedNode[] = [
    {
      id: 'you',
      kind: 'you',
      x: cx,
      y: cy,
      size: config.sizeCenter,
      label: 'You',
      floatDx: 0,
      floatDy: 0,
      floatDuration: 0,
      floatDelay: 0,
    },
  ];
  const edges: RenderedEdge[] = [];
  const l2NodesByParent = new Map<string, ReferralNetworkNode[]>();

  for (const l2Node of networkNodes.filter((node) => node.level === 'l2')) {
    const parentKey = l2Node.parent_address?.toLowerCase();
    if (!parentKey) continue;
    l2NodesByParent.set(parentKey, [
      ...(l2NodesByParent.get(parentKey) ?? []),
      l2Node,
    ]);
  }

  networkNodes
    .filter((node) => node.level === 'l1')
    .slice(0, MOBILE_L1_SLOTS.length)
    .forEach((l1Node, index) => {
      const slot = MOBILE_L1_SLOTS[index];
      if (!slot) return;
      const isL1Others = l1Node.is_overflow;
      const l1Id = `mobile-l1-${index}`;

      nodes.push({
        id: l1Id,
        kind: isL1Others ? 'l1-others' : 'l1',
        x: slot.x,
        y: slot.y,
        size: config.sizeL1,
        label: 'L1',
        sub: isL1Others
          ? `+${l1Node.overflow_count ?? 0} more`
          : formatNodeAddress(l1Node.user_address),
        labelSide: 'bottom',
        ...NO_FLOAT,
      });
      edges.push({
        id: `edge-you-${l1Id}`,
        kind: 'l1',
        from: pointToward({ x: cx, y: cy }, slot, config.l0OuterSize / 2),
        to: pointToward(slot, { x: cx, y: cy }, config.sizeL1 / 2),
        fromId: 'you',
        toId: l1Id,
      });

      const childNodes =
        l2NodesByParent.get(l1Node.user_address.toLowerCase()) ?? [];
      const childSlots = MOBILE_L2_SLOTS[index] ?? [];
      for (const [childIndex, childNode] of childNodes
        .slice(0, childSlots.length)
        .entries()) {
        const childSlot = childSlots[childIndex];
        if (!childSlot) continue;
        const isL2Others = childNode.is_overflow;
        const l2Id = `mobile-l2-${index}-${childIndex}`;

        nodes.push({
          id: l2Id,
          kind: isL2Others ? 'l2-others' : 'l2',
          x: childSlot.x,
          y: childSlot.y,
          size: config.sizeL2,
          label: 'L2',
          sub: isL2Others
            ? `+${childNode.overflow_count ?? 0} more`
            : formatNodeAddress(childNode.user_address),
          labelSide: childSlot.labelSide,
          ...NO_FLOAT,
        });
        edges.push({
          id: `edge-${l1Id}-${l2Id}`,
          kind: 'l2',
          from: pointToward(slot, childSlot, config.sizeL1 / 2),
          to: pointToward(childSlot, slot, config.sizeL2 / 2),
          fromId: l1Id,
          toId: l2Id,
        });
      }
    });

  return { nodes, edges, cx, cy };
}

function buildGraph(config: GraphConfig, networkNodes: ReferralNetworkNode[]) {
  if (
    config.width === MOBILE_CONFIG.width &&
    config.height === MOBILE_CONFIG.height
  ) {
    return buildMobileGraph(config, networkNodes);
  }

  const cx = config.centerX ?? config.width / 2;
  const cy = config.centerY ?? config.height / 2;

  const nodes: RenderedNode[] = [
    {
      id: 'you',
      kind: 'you',
      x: cx,
      y: cy,
      size: config.sizeCenter,
      label: 'You',
      floatDx: 0,
      floatDy: 0,
      floatDuration: 0,
      floatDelay: 0,
    },
  ];
  const edges: RenderedEdge[] = [];

  const l1Nodes = networkNodes.filter((node) => node.level === 'l1');
  const l2Nodes = networkNodes.filter((node) => node.level === 'l2');

  if (!l1Nodes.length) {
    return { nodes, edges, cx, cy };
  }

  const l2NodesByParent = new Map<string, ReferralNetworkNode[]>();
  const orphanL2Nodes: ReferralNetworkNode[] = [];
  for (const l2Node of l2Nodes) {
    const parentKey = l2Node.parent_address?.toLowerCase();
    if (!parentKey) {
      orphanL2Nodes.push(l2Node);
      continue;
    }

    const currentChildren = l2NodesByParent.get(parentKey) ?? [];
    currentChildren.push(l2Node);
    l2NodesByParent.set(parentKey, currentChildren);
  }

  const l1Step = 360 / l1Nodes.length;

  for (const [i, l1Node] of l1Nodes.entries()) {
    const angle = -90 + i * l1Step;
    const pos1 = polar(cx, cy, config.r1, angle);
    const isL1Others = l1Node.is_overflow;
    const l1Id = isL1Others
      ? `l1-others-${i}`
      : l1Node.user_address || `l1-${i}`;

    nodes.push({
      id: l1Id,
      kind: isL1Others ? 'l1-others' : 'l1',
      x: pos1.x,
      y: pos1.y,
      size: config.sizeL1,
      label: 'L1',
      sub: isL1Others
        ? `+${l1Node.overflow_count ?? 0} more`
        : formatNodeAddress(l1Node.user_address),
      labelSide: 'bottom',
      ...getFloatMotion(i + 1),
    });

    edges.push({
      id: `edge-you-${l1Id}`,
      kind: 'l1',
      from: pointToward({ x: cx, y: cy }, pos1, config.l0OuterSize / 2),
      to: pointToward(pos1, { x: cx, y: cy }, config.sizeL1 / 2),
      fromId: 'you',
      toId: l1Id,
    });

    const childNodes = [
      ...(l2NodesByParent.get(l1Node.user_address.toLowerCase()) ?? []),
      ...(i === l1Nodes.length - 1 ? orphanL2Nodes : []),
    ];
    const childOffsets = getChildAngleOffsets(childNodes.length, config.spread);

    for (const [j, childNode] of childNodes.entries()) {
      const childAngle = angle + (childOffsets[j] ?? 0);
      const pos2 = polar(cx, cy, config.r2, childAngle);
      const isL2Others = childNode.is_overflow;
      const l2Id = isL2Others
        ? `l2-others-${i}-${j}`
        : childNode.user_address || `l2-${i}-${j}`;

      nodes.push({
        id: l2Id,
        kind: isL2Others ? 'l2-others' : 'l2',
        x: pos2.x,
        y: pos2.y,
        size: config.sizeL2,
        label: 'L2',
        sub: isL2Others
          ? `+${childNode.overflow_count ?? 0} more`
          : formatNodeAddress(childNode.user_address),
        labelSide:
          Math.cos((childAngle * Math.PI) / 180) >= 0 ? 'right' : 'left',
        ...getFloatMotion(i * 10 + j + 10),
      });

      edges.push({
        id: `edge-${l1Id}-${l2Id}`,
        kind: 'l2',
        from: pointToward(pos1, pos2, config.sizeL1 / 2),
        to: pointToward(pos2, pos1, config.sizeL2 / 2),
        fromId: l1Id,
        toId: l2Id,
      });
    }
  }

  return { nodes, edges, cx, cy };
}

function nodeStyle(node: RenderedNode): CSSProperties {
  return {
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.size}px`,
    height: `${node.size}px`,
  };
}

function floatStyle(node: RenderedNode): CSSProperties | undefined {
  if (node.kind === 'you') return undefined;

  return {
    '--dx': `${node.floatDx}px`,
    '--dy': `${node.floatDy}px`,
    animation: `squadNetworkFloat ${node.floatDuration}s ease-in-out ${node.floatDelay}s infinite alternate`,
  } as CSSProperties;
}

const LEGEND_BASE_W = 183;

const LegendMarker: FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden
    className="size-2 shrink-0 rounded-[2px]"
    style={{ backgroundColor: color }}
  />
);

const Legend: FC<{ layout?: 'vertical' | 'horizontal'; scale?: number }> = ({
  layout = 'vertical',
  scale = 1,
}) => {
  if (layout === 'horizontal') {
    return (
      <div className="grid w-[228px] grid-cols-[73px_61px_70px] gap-3 text-[10px]/[1.4] font-medium text-white">
        <div className="flex items-center">
          <LegendMarker color="#00DFEB" />
          <span className="ml-1">
            <Trans>You</Trans>
          </span>
          <span className="ml-[7px]">
            <Trans>Leader</Trans>
          </span>
        </div>
        <div className="flex items-center">
          <LegendMarker color="#86D4DE" />
          <span className="ml-1">L1</span>
          <span className="ml-[7px]">
            <Trans>Direct</Trans>
          </span>
        </div>
        <div className="flex items-center">
          <LegendMarker color="#086874" />
          <span className="ml-1">L2</span>
          <span className="ml-[7px]">
            <Trans>Indirect</Trans>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-[10px] text-xs/[1.2] font-medium text-white"
      style={{ width: `${LEGEND_BASE_W * Math.max(scale, 0.5)}px` }}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <LegendMarker color="#00DFEB" />
          <span>
            <Trans>You</Trans>
          </span>
        </div>
        <span>
          <Trans>Leader</Trans>
        </span>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <LegendMarker color="#86D4DE" />
          <span>L1</span>
        </div>
        <span>
          <Trans>Direct</Trans>
        </span>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center gap-1">
          <LegendMarker color="#086874" />
          <span>L2</span>
        </div>
        <span>
          <Trans>Indirect</Trans>
        </span>
      </div>
    </div>
  );
};

const EmptySquadState = () => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <p className="w-full text-xs/[1.2] text-white/50">
      <Trans>Your squad is empty.</Trans>
    </p>
  </div>
);

const GraphCanvas: FC<{
  config: GraphConfig;
  networkNodes: ReferralNetworkNode[];
  className?: string;
  padding?: number;
  showLegend?: boolean;
}> = ({ config, networkNodes, className, padding = 20, showLegend = true }) => {
  const [scale, setScale] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updateScale = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const availW = el.clientWidth - padding * 2;
    const s = Math.min(availW / config.width, 1);
    setScale(s);
  }, [config.width, padding]);

  useEffect(() => {
    updateScale();
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  const nodeMap = useMemo(() => {
    const graph = buildGraph(config, networkNodes);
    return {
      nodes: graph.nodes,
      edges: graph.edges,
      centerX: graph.cx,
      centerY: graph.cy,
    };
  }, [config, networkNodes]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative overflow-hidden border border-white/10 bg-white/[0.01]',
        className,
      )}
      style={{
        borderRadius: config.cardRadius,
        height: `${(scale > 0 ? config.height * scale : config.height) + padding * 2}px`,
      }}
    >
      <div
        className="absolute left-1/2"
        style={{
          width: `${config.width}px`,
          height: `${config.height}px`,
          top: '50%',
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <svg
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <circle
            cx={nodeMap.centerX}
            cy={nodeMap.centerY}
            r={config.innerGlow * 0.5}
            fill="url(#graphGlow)"
          />
          <circle
            cx={nodeMap.centerX}
            cy={nodeMap.centerY}
            r={config.innerGlow * 0.5}
            fill="none"
            stroke="#257684"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeLinecap="round"
          />

          <defs>
            <radialGradient id="graphGlow">
              <stop offset="0%" stopColor="rgba(11,134,157,0.15)" />
              <stop offset="70%" stopColor="rgba(12,24,44,0)" />
            </radialGradient>
          </defs>

          {nodeMap.edges.map((edge) => {
            return (
              <line
                key={edge.id}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={NETWORK_LINE_STROKE}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {nodeMap.nodes.map((node) => {
          const isYouNode = node.kind === 'you';
          const isL1Node = node.kind === 'l1' || node.kind === 'l1-others';

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={nodeStyle(node)}
            >
              <div className="relative h-full w-full" style={floatStyle(node)}>
                <div className="absolute inset-0 grid place-items-center overflow-visible">
                  {isYouNode ? (
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: config.l0OuterSize,
                          height: config.l0OuterSize,
                          maxWidth: 'none',
                          border: `${config.l0OuterSize / 80}px solid #257684`,
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00DFEB]"
                        style={{
                          width: config.l0InnerSize,
                          height: config.l0InnerSize,
                        }}
                      />
                      <span className="text-bg-1 relative z-10 text-xs font-medium md:text-2xl">
                        <Trans>You</Trans>
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 size-full rounded-full"
                        style={{
                          backgroundColor: isL1Node ? '#86D4DE' : '#086874',
                        }}
                      />
                      <span
                        className={cn(
                          'relative z-10 text-center leading-normal font-medium',
                          node.kind === 'l1' &&
                            'text-xs tracking-[-0.48px] text-[rgba(10,16,18,0.70)] md:text-2xl md:tracking-[-0.96px]',
                          node.kind === 'l1-others' &&
                            'text-xs tracking-[-0.48px] text-[rgba(10,16,18,0.70)] md:text-2xl md:tracking-[-0.96px]',
                          node.kind === 'l2' &&
                            'text-t-270 text-[10px] tracking-[-0.4px] md:text-xl md:tracking-[-0.8px]',
                          node.kind === 'l2-others' &&
                            'text-t-270 text-[10px] tracking-[-0.4px] md:text-xl md:tracking-[-0.8px]',
                        )}
                      >
                        {node.label}
                      </span>
                    </>
                  )}
                </div>

                {node.sub ? (
                  <div
                    className={cn(
                      'pointer-events-none absolute w-[52px] text-[8px]/normal font-medium tracking-[-0.32px] whitespace-nowrap text-white/70 md:w-24 md:text-[14px] md:tracking-[-0.56px]',
                      node.labelSide === 'left'
                        ? 'top-1/2 right-[calc(100%+4px)] -translate-y-1/2 text-right md:right-[calc(100%+10px)]'
                        : node.labelSide === 'right'
                          ? 'top-1/2 left-[calc(100%+4px)] -translate-y-1/2 text-left md:left-[calc(100%+10px)]'
                          : node.labelSide === 'bottom-right'
                            ? 'top-full left-1/2 w-12 text-left'
                            : 'top-full left-1/2 -translate-x-1/2 text-center md:top-[calc(100%+3px)]',
                    )}
                  >
                    {node.sub}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {showLegend ? (
        <div className="absolute right-4 bottom-4 z-10">
          <Legend scale={scale} />
        </div>
      ) : null}
    </div>
  );
};

const SquadNetworkMap: FC<{ showTitle?: boolean }> = ({ showTitle = true }) => {
  const { data: network } = useReferralNetwork();
  const networkNodes = network?.nodes ?? [];
  const hasLoadedNetwork = network !== undefined;
  const hasSquad = networkNodes.some((node) => node.level === 'l1');

  return (
    <div className={cn(showTitle && 'space-y-4')}>
      {showTitle ? (
        <h3 className="text-sm/tight font-medium">
          <Trans>Your Squad Network</Trans>
        </h3>
      ) : null}

      {hasLoadedNetwork && !hasSquad ? (
        <EmptySquadState />
      ) : (
        <>
          <div className="hidden md:block">
            <GraphCanvas
              config={DESKTOP_CONFIG}
              networkNodes={networkNodes}
              className="rounded-3xl"
            />
          </div>

          <div className="md:hidden">
            <GraphCanvas
              config={MOBILE_CONFIG}
              networkNodes={networkNodes}
              className="border-0 bg-transparent"
              padding={0}
              showLegend={false}
            />
            <div className="mt-4">
              <Legend layout="horizontal" />
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes squadNetworkFloat {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(var(--dx), var(--dy), 0); }
        }
      `}</style>
    </div>
  );
};

export default SquadNetworkMap;
