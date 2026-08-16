import type { ExternalSwapRouteStream } from '@hertzflow/sdk-v2/types/externalSwap';

export type RouteGraphNode = {
  id: string;
  address: string;
  depth: number;
  order: number;
};

export type RouteGraphLink = {
  id: string;
  source: string;
  target: string;
  providerCode: string;
  pool: string;
  percentageBps: number;
  strokeWidth: number;
  streamIndexes: number[];
};

export type RouteGraphModel = {
  nodes: RouteGraphNode[];
  links: RouteGraphLink[];
  providerCodes: string[];
  maxDepth: number;
};

export type RouteGraphLayoutNode = {
  id: string;
  depth: number;
  order: number;
  kind: 'token';
  value: number;
  routeNodeId: string;
};

export type RouteGraphLayoutLink = {
  id: string;
  source: string;
  target: string;
  routeLinkId: string;
  value: number;
};

export type RouteGraphLayoutModel = {
  nodes: RouteGraphLayoutNode[];
  links: RouteGraphLayoutLink[];
};

export type RouteEndpointAnchor = {
  id: string;
  desiredY: number;
  strokeWidth: number;
};

export type RouteNodeLinkAnchor = RouteEndpointAnchor & {
  providerCode: string;
  side: 'incoming' | 'outgoing';
  sortY: number;
  streamIndexes: number[];
};

export type DirectRouteLane = {
  id: string;
  order: number;
  strokeWidth: number;
};

export type RouteGraphPathNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RouteGraphPathLink = {
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  strokeWidth: number;
};

export const ROUTE_GRAPH_LINK_WIDTH = 15;
export const ROUTE_GRAPH_NODE_GAP = 20;
export const ROUTE_GRAPH_ENDPOINT_PADDING = 40;
export const ROUTE_GRAPH_LAYOUT_NODE_PADDING =
  ROUTE_GRAPH_NODE_GAP + (36 - ROUTE_GRAPH_LINK_WIDTH);
export const ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT = 540;
export const ROUTE_GRAPH_MAX_NODE_WIDTH = 100;

const PROVIDER_COLORS: Record<string, string> = {
  PANCAKEV2: '#4CF3E0CC',
  PANCAKEV3: '#2A4D8DCC',
  PANCAKE_INFINITY_CL: '#2A4D8DCC',
  UNISWAPV3: '#4B2A8DCC',
  UNISWAPV4: '#8D66D6CC',
  DODO: '#FFD38DCC',
  THENAV3: '#8D66D6CC',
  PANCAKE_STABLE: '#99F8ACCC',
  LISTA_STABLE: '#39B3FFCC',
  PANCAKE_INFINITY_LB: '#FFB668CC',
  SQUADSWAP_V2: '#50FFF3CC',
  SQUADSWAP_V3: '#99F8ACCC',
  WOMBAT: '#FFD38DCC',
  THENA_FUSION: '#2A4D8DCC',
  SUSHISWAP_V2: '#39B3FFCC',
  SUSHISWAP_V3: '#39B3FFCC',
  APESWAP: '#FFB668CC',
  BISWAP: '#4B2A8DCC',
  NOMISWAP_STABLE: '#39B3FFCC',
  BABYDOGESWAP: '#39B3FFCC',
  BABYSWAP: '#FFD38DCC',
};

const FALLBACK_PROVIDER_COLORS = [
  '#4CF3E0CC',
  '#2A4D8DCC',
  '#4B2A8DCC',
  '#8D66D6CC',
  '#FFD38DCC',
  '#99F8ACCC',
  '#39B3FFCC',
  '#FFB668CC',
] as const;

const normalize = (value: string) => value.toLowerCase();

export const formatRouteTokenFallbackLabel = (address: string) =>
  address.length > 11 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

export const getRouteStrokeWidth = () => ROUTE_GRAPH_LINK_WIDTH;

export const getRouteGraphNodeWidth = (
  graphWidth: number,
  maxDepth: number,
  sideGap = 0,
) => {
  if (maxDepth === 0) return ROUTE_GRAPH_MAX_NODE_WIDTH;

  return Math.max(
    36,
    Math.min(
      ROUTE_GRAPH_MAX_NODE_WIDTH,
      (graphWidth - sideGap * 2 - ROUTE_GRAPH_NODE_GAP * maxDepth) /
        (maxDepth + 1),
    ),
  );
};

export const getRouteGraphColumnBounds = (
  graphWidth: number,
  maxDepth: number,
  depth: number,
  tokenNodeWidth: number,
  endpointNodeWidth = 36,
  sideGap = 0,
) => {
  const isEndpoint = depth === 0 || depth === maxDepth;
  const width = isEndpoint ? endpointNodeWidth : tokenNodeWidth;
  if (maxDepth === 0) return { x: sideGap, width };

  const intermediateColumnCount = Math.max(0, maxDepth - 1);
  const columnGap =
    (graphWidth -
      sideGap * 2 -
      endpointNodeWidth * 2 -
      tokenNodeWidth * intermediateColumnCount) /
    maxDepth;
  const precedingIntermediateCount = Math.max(0, depth - 1);

  return {
    x:
      sideGap +
      (depth > 0 ? endpointNodeWidth : 0) +
      precedingIntermediateCount * tokenNodeWidth +
      depth * columnGap,
    width,
  };
};

export const getRouteProviderColor = (providerCode: string) => {
  const normalizedCode = providerCode.toUpperCase();
  const designColor = PROVIDER_COLORS[normalizedCode];
  if (designColor) return designColor;

  let hash = 0;
  for (const character of normalizedCode) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return FALLBACK_PROVIDER_COLORS[hash % FALLBACK_PROVIDER_COLORS.length]!;
};

export const getRouteProviderColorMap = (providerCodes: string[]) => {
  const colorByProvider: Record<string, string> = {};
  const usedColors = new Set<string>();
  const pendingCodes: string[] = [];

  providerCodes.forEach((providerCode) => {
    const normalizedCode = providerCode.toUpperCase();
    const designColor = PROVIDER_COLORS[normalizedCode];

    if (designColor) {
      colorByProvider[normalizedCode] = designColor;
      usedColors.add(designColor);
    } else {
      pendingCodes.push(normalizedCode);
    }
  });

  pendingCodes.forEach((providerCode) => {
    const fallbackStart = FALLBACK_PROVIDER_COLORS.indexOf(
      getRouteProviderColor(
        providerCode,
      ) as (typeof FALLBACK_PROVIDER_COLORS)[number],
    );
    const fallbackColor =
      FALLBACK_PROVIDER_COLORS.find(
        (color, index) => index >= fallbackStart && !usedColors.has(color),
      ) ??
      FALLBACK_PROVIDER_COLORS.find((color) => !usedColors.has(color)) ??
      getRouteProviderColor(providerCode);

    colorByProvider[providerCode] = fallbackColor;
    usedColors.add(fallbackColor);
  });

  return colorByProvider;
};

export const sortRouteGraphLinksForDisplay = <T extends RouteGraphLink>(
  links: readonly T[],
) =>
  [...links].sort(
    (left, right) =>
      right.strokeWidth - left.strokeWidth ||
      (left.streamIndexes[0] ?? 0) - (right.streamIndexes[0] ?? 0) ||
      left.id.localeCompare(right.id),
  );

const getDirectRoutePath = (link: RouteGraphPathLink) => {
  const controlX = (link.sourceX + link.targetX) / 2;

  return `M${link.sourceX},${link.sourceY} C${controlX},${link.sourceY} ${controlX},${link.targetY} ${link.targetX},${link.targetY}`;
};

const getRouteGraphBypass = (
  link: RouteGraphPathLink,
  nodes: RouteGraphPathNode[],
  contentHeight: number,
) => {
  const obstacles = nodes.filter(
    (node) =>
      node.id !== link.source &&
      node.id !== link.target &&
      node.x > link.sourceX &&
      node.x + node.width < link.targetX,
  );
  const halfStroke = link.strokeWidth / 2;
  const pathTop = Math.min(link.sourceY, link.targetY) - halfStroke;
  const pathBottom = Math.max(link.sourceY, link.targetY) + halfStroke;
  const blockingObstacles = obstacles.filter(
    (node) => node.y < pathBottom && node.y + node.height > pathTop,
  );

  if (blockingObstacles.length === 0) return;

  const clearance = halfStroke + 4;
  const minRail = halfStroke;
  const maxRail = contentHeight - halfStroke;
  const forbiddenIntervals = obstacles
    .map((node) => [node.y - clearance, node.y + node.height + clearance])
    .sort((left, right) => left[0]! - right[0]!)
    .reduce<number[][]>((merged, interval) => {
      const previous = merged[merged.length - 1];

      if (previous && interval[0]! <= previous[1]!) {
        previous[1] = Math.max(previous[1]!, interval[1]!);
      } else {
        merged.push([...interval]);
      }

      return merged;
    }, []);
  const availableIntervals: number[][] = [];
  let availableStart = minRail;

  forbiddenIntervals.forEach(([start = minRail, end = maxRail]) => {
    if (start > availableStart) {
      availableIntervals.push([availableStart, Math.min(start, maxRail)]);
    }
    availableStart = Math.max(availableStart, end);
  });
  if (availableStart < maxRail) {
    availableIntervals.push([availableStart, maxRail]);
  }

  const preferredY = (link.sourceY + link.targetY) / 2;
  const railCandidates = availableIntervals
    .filter(([start = minRail, end = maxRail]) => end >= start)
    .map(([start = minRail, end = maxRail]) =>
      Math.max(start, Math.min(end, preferredY)),
    );

  if (railCandidates.length === 0) return;

  const firstBlockingObstacle = [...blockingObstacles].sort(
    (left, right) => left.x - right.x,
  )[0]!;
  const blockingCenterY =
    firstBlockingObstacle.y + firstBlockingObstacle.height / 2;
  const sourceIsBelowObstacle = link.sourceY >= blockingCenterY;
  const sameSideCandidates = railCandidates.filter((candidate) =>
    sourceIsBelowObstacle
      ? candidate >=
        firstBlockingObstacle.y + firstBlockingObstacle.height + clearance
      : candidate <= firstBlockingObstacle.y - clearance,
  );
  const preferredCandidates =
    sameSideCandidates.length > 0 ? sameSideCandidates : railCandidates;
  const railY = preferredCandidates.reduce((nearest, candidate) => {
    const nearestDistance =
      Math.abs(link.sourceY - nearest) + Math.abs(link.targetY - nearest);
    const candidateDistance =
      Math.abs(link.sourceY - candidate) + Math.abs(link.targetY - candidate);

    if (candidateDistance !== nearestDistance) {
      return candidateDistance < nearestDistance ? candidate : nearest;
    }

    return Math.abs(candidate - preferredY) < Math.abs(nearest - preferredY)
      ? candidate
      : nearest;
  });
  return { obstacles, railY };
};

export const getRouteGraphBypassLaneY = (
  link: RouteGraphPathLink,
  nodes: RouteGraphPathNode[],
  contentHeight: number,
) => getRouteGraphBypass(link, nodes, contentHeight)?.railY;

export const getRouteGraphLinkPath = (
  link: RouteGraphPathLink,
  nodes: RouteGraphPathNode[],
  contentHeight: number,
) => {
  const bypass = getRouteGraphBypass(link, nodes, contentHeight);
  if (!bypass) return getDirectRoutePath(link);

  const { obstacles, railY } = bypass;
  const clearance = link.strokeWidth / 2 + 4;
  const horizontalDistance = link.targetX - link.sourceX;
  const bendWidth = Math.min(120, horizontalDistance * 0.3);
  const firstObstacleX = Math.min(...obstacles.map((node) => node.x));
  const lastObstacleX = Math.max(
    ...obstacles.map((node) => node.x + node.width),
  );
  const routeMidX = (link.sourceX + link.targetX) / 2;
  const firstTurnX = Math.min(
    routeMidX,
    Math.max(
      link.sourceX + 12,
      Math.min(link.sourceX + bendWidth, firstObstacleX - clearance),
    ),
  );
  const secondTurnX = Math.max(
    routeMidX,
    Math.min(
      link.targetX - 12,
      Math.max(link.targetX - bendWidth, lastObstacleX + clearance),
    ),
  );
  const firstControlOffset = (firstTurnX - link.sourceX) * 0.55;
  const secondControlOffset = (link.targetX - secondTurnX) * 0.55;

  return [
    `M${link.sourceX},${link.sourceY}`,
    `C${link.sourceX + firstControlOffset},${link.sourceY} ${firstTurnX - firstControlOffset},${railY} ${firstTurnX},${railY}`,
    `L${secondTurnX},${railY}`,
    `C${secondTurnX + secondControlOffset},${railY} ${link.targetX - secondControlOffset},${link.targetY} ${link.targetX},${link.targetY}`,
  ].join(' ');
};

export const buildRouteGraph = (
  streams: ExternalSwapRouteStream[],
): RouteGraphModel => {
  const nodes = new Map<string, RouteGraphNode>();
  const links = new Map<string, RouteGraphLink>();
  const providerCodes: string[] = [];
  const seenProviders = new Set<string>();
  let nodeOrder = 0;
  const maxDepth = Math.max(0, ...streams.map((stream) => stream.hops.length));

  const ensureNode = (address: string, depth: number) => {
    const normalizedAddress = normalize(address);
    const id = `${depth}:${normalizedAddress}`;

    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        address: normalizedAddress,
        depth,
        order: nodeOrder++,
      });
    }

    return id;
  };

  streams.forEach((stream, streamIndex) => {
    if (stream.hops.length === 0) return;

    const streamStrokeWidth = getRouteStrokeWidth();

    stream.hops.forEach((hop, hopIndex) => {
      const providerCode = hop.providerCode.toUpperCase();
      const source = ensureNode(hop.tokenIn, hopIndex);
      const isLastHop = hopIndex === stream.hops.length - 1;
      const target = ensureNode(
        hop.tokenOut,
        isLastHop ? maxDepth : hopIndex + 1,
      );
      const pool = normalize(hop.pool);
      const edgeKey = `${source}|${target}|${providerCode}|${pool}`;
      const existingLink = links.get(edgeKey);

      if (!seenProviders.has(providerCode)) {
        seenProviders.add(providerCode);
        providerCodes.push(providerCode);
      }

      if (existingLink) {
        existingLink.percentageBps += stream.percentageBps;
        existingLink.streamIndexes.push(streamIndex);
      } else {
        links.set(edgeKey, {
          id: edgeKey,
          source,
          target,
          providerCode,
          pool,
          percentageBps: stream.percentageBps,
          strokeWidth: streamStrokeWidth,
          streamIndexes: [streamIndex],
        });
      }
    });
  });

  return {
    nodes: [...nodes.values()],
    links: [...links.values()],
    providerCodes,
    maxDepth,
  };
};

const getRouteGraphNodeFlowWidth = (
  nodeId: string,
  links: RouteGraphLink[],
) => {
  const incomingWidth = links
    .filter((link) => link.target === nodeId)
    .reduce((total, link) => total + link.strokeWidth, 0);
  const outgoingWidth = links
    .filter((link) => link.source === nodeId)
    .reduce((total, link) => total + link.strokeWidth, 0);

  return Math.max(incomingWidth, outgoingWidth);
};

export const getRouteGraphNodeHeight = (
  nodeId: string,
  links: RouteGraphLink[],
) => Math.max(36, getRouteGraphNodeFlowWidth(nodeId, links) + 16);

export const buildRouteGraphLayoutModel = (
  model: RouteGraphModel,
): RouteGraphLayoutModel => {
  const nodes: RouteGraphLayoutNode[] = model.nodes.map((node) => ({
    id: node.id,
    depth: node.depth,
    order: node.order * 2,
    kind: 'token',
    value: getRouteGraphNodeFlowWidth(node.id, model.links),
    routeNodeId: node.id,
  }));
  const links: RouteGraphLayoutLink[] = model.links.map((link) => ({
    id: `link:${link.id}`,
    source: link.source,
    target: link.target,
    routeLinkId: link.id,
    value: link.strokeWidth,
  }));

  nodes.sort(
    (left, right) =>
      left.depth - right.depth ||
      left.order - right.order ||
      left.id.localeCompare(right.id),
  );

  return { nodes, links };
};

export const getRouteGraphLayoutHeight = (
  model: RouteGraphModel,
  nodePadding = ROUTE_GRAPH_LAYOUT_NODE_PADDING,
) => {
  const columns = new Map<number, RouteGraphLayoutNode[]>();

  buildRouteGraphLayoutModel(model).nodes.forEach((node) => {
    const column = columns.get(node.depth) ?? [];
    column.push(node);
    columns.set(node.depth, column);
  });

  return Math.max(
    0,
    ...[...columns.values()].map(
      (column) =>
        column.reduce((total, node) => total + node.value, 0) +
        Math.max(0, column.length - 1) * nodePadding,
    ),
  );
};

export const spreadRouteEndpointAnchors = (
  anchors: RouteEndpointAnchor[],
  contentHeight: number,
  gap = ROUTE_GRAPH_NODE_GAP,
  edgePadding = ROUTE_GRAPH_ENDPOINT_PADDING,
) => {
  const sortedAnchors = [...anchors].sort(
    (left, right) =>
      left.desiredY - right.desiredY || left.id.localeCompare(right.id),
  );
  if (sortedAnchors.length === 0) return new Map<string, number>();

  const positions: number[] = [];

  sortedAnchors.forEach((anchor, index) => {
    const previousAnchor = sortedAnchors[index - 1];
    const previousPosition = positions[index - 1];
    const clampedDesiredY = Math.max(
      edgePadding + anchor.strokeWidth / 2,
      Math.min(
        contentHeight - edgePadding - anchor.strokeWidth / 2,
        anchor.desiredY,
      ),
    );
    const minimumPosition =
      previousAnchor && previousPosition !== undefined
        ? previousPosition +
          previousAnchor.strokeWidth / 2 +
          gap +
          anchor.strokeWidth / 2
        : edgePadding + anchor.strokeWidth / 2;

    positions.push(Math.max(clampedDesiredY, minimumPosition));
  });

  const desiredCenter =
    (sortedAnchors[0]!.desiredY +
      sortedAnchors[sortedAnchors.length - 1]!.desiredY) /
    2;
  const positionedCenter =
    (positions[0]! + positions[positions.length - 1]!) / 2;
  const firstHalfWidth = sortedAnchors[0]!.strokeWidth / 2;
  const lastHalfWidth =
    sortedAnchors[sortedAnchors.length - 1]!.strokeWidth / 2;
  const minimumShift = edgePadding + firstHalfWidth - positions[0]!;
  const maximumShift =
    contentHeight -
    edgePadding -
    lastHalfWidth -
    positions[positions.length - 1]!;
  const shift = Math.max(
    minimumShift,
    Math.min(maximumShift, desiredCenter - positionedCenter),
  );
  const anchorYById = new Map<string, number>();

  sortedAnchors.forEach((anchor, index) => {
    anchorYById.set(anchor.id, positions[index]! + shift);
  });

  return anchorYById;
};

export const alignRouteNodeLinkAnchors = (
  anchors: RouteNodeLinkAnchor[],
  nodeY: number,
  nodeHeight: number,
) => {
  const groups: Array<{
    anchors: RouteNodeLinkAnchor[];
    providerCode: string;
    streamIndexes: Set<number>;
  }> = [];

  anchors.forEach((anchor) => {
    const matchingGroups = groups.filter(
      (group) =>
        group.providerCode === anchor.providerCode &&
        anchor.streamIndexes.some((index) => group.streamIndexes.has(index)),
    );

    if (matchingGroups.length === 0) {
      groups.push({
        anchors: [anchor],
        providerCode: anchor.providerCode,
        streamIndexes: new Set(anchor.streamIndexes),
      });
      return;
    }

    const primaryGroup = matchingGroups[0]!;
    primaryGroup.anchors.push(anchor);
    anchor.streamIndexes.forEach((index) =>
      primaryGroup.streamIndexes.add(index),
    );
    matchingGroups.slice(1).forEach((group) => {
      primaryGroup.anchors.push(...group.anchors);
      group.streamIndexes.forEach((index) =>
        primaryGroup.streamIndexes.add(index),
      );
      groups.splice(groups.indexOf(group), 1);
    });
  });

  const sortedGroups = groups.sort((left, right) => {
    const getSortY = (group: (typeof groups)[number]) => {
      const outgoingAnchors = group.anchors.filter(
        (anchor) => anchor.side === 'outgoing',
      );
      const sortAnchors =
        outgoingAnchors.length > 0 ? outgoingAnchors : group.anchors;

      return (
        sortAnchors.reduce((total, anchor) => total + anchor.sortY, 0) /
        sortAnchors.length
      );
    };
    const leftY = getSortY(left);
    const rightY = getSortY(right);

    return (
      leftY - rightY || left.anchors[0]!.id.localeCompare(right.anchors[0]!.id)
    );
  });
  const totalWidth = sortedGroups.reduce(
    (total, group) =>
      total + Math.max(...group.anchors.map((anchor) => anchor.strokeWidth)),
    0,
  );
  let cursorY = nodeY + (nodeHeight - totalWidth) / 2;
  const anchorYById = new Map<string, number>();

  sortedGroups.forEach((group) => {
    const width = Math.max(
      ...group.anchors.map((anchor) => anchor.strokeWidth),
    );
    const anchorY = cursorY + width / 2;

    group.anchors.forEach((anchor) => anchorYById.set(anchor.id, anchorY));
    cursorY += width;
  });

  return anchorYById;
};

export const distributeDirectRouteLanes = (
  links: DirectRouteLane[],
  intermediateNodes: RouteGraphPathNode[],
  contentHeight: number,
  gap = ROUTE_GRAPH_NODE_GAP,
  edgePadding = ROUTE_GRAPH_ENDPOINT_PADDING,
) => {
  const sortedLinks = [...links].sort(
    (left, right) =>
      left.order - right.order || left.id.localeCompare(right.id),
  );
  if (sortedLinks.length === 0) return new Map<string, number>();

  if (intermediateNodes.length === 0) {
    return spreadRouteEndpointAnchors(
      sortedLinks.map((link, index) => ({
        id: link.id,
        desiredY: contentHeight / 2 + index * 0.001,
        strokeWidth: link.strokeWidth,
      })),
      contentHeight,
      gap,
      edgePadding,
    );
  }

  const topBoundary =
    Math.min(...intermediateNodes.map((node) => node.y)) - gap;
  const bottomBoundary =
    Math.max(...intermediateNodes.map((node) => node.y + node.height)) + gap;
  const lineSpan = (count: number) =>
    count === 0
      ? 0
      : sortedLinks
          .slice(0, count)
          .reduce((total, link) => total + link.strokeWidth, 0) +
        (count - 1) * gap;
  const capacity = (height: number) => {
    let count = 0;

    while (
      count < sortedLinks.length &&
      lineSpan(count + 1) <= Math.max(0, height)
    ) {
      count += 1;
    }

    return count;
  };
  const topCapacity = capacity(topBoundary - edgePadding);
  const bottomCapacity = capacity(contentHeight - edgePadding - bottomBoundary);
  const desiredTopCount = Math.ceil(sortedLinks.length / 2);
  const minimumTopCount = Math.max(0, sortedLinks.length - bottomCapacity);
  const maximumTopCount = Math.min(sortedLinks.length, topCapacity);
  const topCount =
    minimumTopCount <= maximumTopCount
      ? Math.max(minimumTopCount, Math.min(maximumTopCount, desiredTopCount))
      : desiredTopCount;
  const topLinks = sortedLinks.slice(0, topCount);
  const bottomLinks = sortedLinks.slice(topCount);
  const laneYById = new Map<string, number>();
  let cursorY = Math.max(edgePadding, topBoundary - lineSpan(topLinks.length));

  topLinks.forEach((link) => {
    laneYById.set(link.id, cursorY + link.strokeWidth / 2);
    cursorY += link.strokeWidth + gap;
  });
  cursorY = Math.max(
    edgePadding,
    Math.min(
      contentHeight - edgePadding - lineSpan(bottomLinks.length),
      bottomBoundary,
    ),
  );
  bottomLinks.forEach((link) => {
    laneYById.set(link.id, cursorY + link.strokeWidth / 2);
    cursorY += link.strokeWidth + gap;
  });

  return laneYById;
};

const getRouteGraphEndpointSpan = (model: RouteGraphModel, gap: number) => {
  const endpointNodes = model.nodes.filter(
    (node) => node.depth === 0 || node.depth === model.maxDepth,
  );

  return Math.max(
    0,
    ...endpointNodes.map((node) => {
      const adjacentLinks = model.links.filter(
        (link) => link.source === node.id || link.target === node.id,
      );

      return (
        adjacentLinks.reduce((total, link) => total + link.strokeWidth, 0) +
        Math.max(0, adjacentLinks.length - 1) * gap +
        ROUTE_GRAPH_ENDPOINT_PADDING * 2
      );
    }),
  );
};

export const getRouteGraphContentHeight = (
  model: RouteGraphModel,
  visibleHeight = 540,
  nodeGap = ROUTE_GRAPH_NODE_GAP,
  nodePadding = ROUTE_GRAPH_LAYOUT_NODE_PADDING,
) => {
  const columns = new Map<number, RouteGraphLayoutNode[]>();

  buildRouteGraphLayoutModel(model).nodes.forEach((node) => {
    const column = columns.get(node.depth) ?? [];
    column.push(node);
    columns.set(node.depth, column);
  });

  const tallestVisibleColumn = Math.max(
    0,
    ...[...columns.values()].map(
      (column) =>
        column.reduce(
          (total, node) => total + Math.max(36, node.value + 16),
          0,
        ) +
        Math.max(0, column.length - 1) * nodeGap,
    ),
  );

  return Math.ceil(
    Math.max(
      visibleHeight,
      tallestVisibleColumn,
      getRouteGraphEndpointSpan(model, nodeGap),
      getRouteGraphLayoutHeight(model, nodePadding) + 16,
    ),
  );
};

export const getRouteGraphViewportHeight = (
  contentHeight: number,
  maxHeight = ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT,
) => Math.min(contentHeight, maxHeight);
