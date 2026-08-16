import assert from 'node:assert/strict';
import test from 'node:test';

import {
  alignRouteNodeLinkAnchors,
  buildRouteGraph,
  buildRouteGraphLayoutModel,
  distributeDirectRouteLanes,
  formatRouteTokenFallbackLabel,
  getRouteGraphBypassLaneY,
  getRouteGraphColumnBounds,
  getRouteGraphContentHeight,
  getRouteGraphLayoutHeight,
  getRouteGraphLinkPath,
  getRouteGraphNodeWidth,
  getRouteGraphNodeHeight,
  getRouteProviderColor,
  getRouteProviderColorMap,
  getRouteStrokeWidth,
  getRouteGraphViewportHeight,
  ROUTE_GRAPH_LAYOUT_NODE_PADDING,
  ROUTE_GRAPH_ENDPOINT_PADDING,
  ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT,
  ROUTE_GRAPH_NODE_GAP,
  sortRouteGraphLinksForDisplay,
  spreadRouteEndpointAnchors,
} from './routeGraph';
import type {
  ExternalSwapRouteStream,
  ExternalSwapRouteStreamHop,
} from '@hertzflow/sdk-v2/types/externalSwap';

const address = (suffix: string) =>
  `0x${suffix.padStart(40, '0')}` as `0x${string}`;

const hop = ({
  providerCode = 'PANCAKEV3',
  pool = address('100'),
  tokenIn = address('1'),
  tokenOut = address('2'),
}: Partial<ExternalSwapRouteStreamHop> = {}): ExternalSwapRouteStreamHop => ({
  providerCode,
  pool,
  tokenIn,
  tokenOut,
  amountIn: 1n,
  amountOut: 1n,
  feeRate: '0.0025',
});

const stream = (
  percentageBps: number,
  hops: ExternalSwapRouteStreamHop[],
): ExternalSwapRouteStream => ({ percentageBps, hops });

test('shortens unresolved route token addresses for narrow nodes', () => {
  assert.equal(
    formatRouteTokenFallbackLabel('0x1234567890abcdef1234567890abcdef12345678'),
    '0x1234…5678',
  );
  assert.equal(formatRouteTokenFallbackLabel('0x1234'), '0x1234');
});

test('builds a single route and keeps the same token at different depths distinct', () => {
  const tokenA = address('1');
  const tokenB = address('2');
  const model = buildRouteGraph([
    stream(10_000, [
      hop({ tokenIn: tokenA, tokenOut: tokenB }),
      hop({
        pool: address('101'),
        tokenIn: tokenB,
        tokenOut: tokenA,
      }),
    ]),
  ]);

  assert.equal(model.nodes.length, 3);
  assert.deepEqual(
    model.nodes.map((node) => node.id),
    [`0:${tokenA}`, `1:${tokenB}`, `2:${tokenA}`],
  );
  assert.equal(model.links.length, 2);
  assert.equal(model.maxDepth, 2);
});

test('merges shared edges without duplicating their fixed-width lines', () => {
  const tokenA = address('1');
  const tokenB = address('2');
  const tokenC = address('3');
  const sharedFirstHop = hop({
    pool: address('200'),
    tokenIn: tokenA,
    tokenOut: tokenB,
  });
  const sharedSecondHop = hop({
    providerCode: 'UNISWAPV4',
    pool: address('201'),
    tokenIn: tokenB,
    tokenOut: tokenC,
  });
  const model = buildRouteGraph([
    stream(6_000, [sharedFirstHop, sharedSecondHop]),
    stream(4_000, [sharedFirstHop, sharedSecondHop]),
  ]);

  assert.equal(model.nodes.length, 3);
  assert.equal(model.links.length, 2);
  assert.deepEqual(model.providerCodes, ['PANCAKEV3', 'UNISWAPV4']);
  assert.deepEqual(
    model.links.map((link) => ({
      percentageBps: link.percentageBps,
      strokeWidth: link.strokeWidth,
      streams: link.streamIndexes,
    })),
    [
      { percentageBps: 10_000, strokeWidth: 15, streams: [0, 1] },
      { percentageBps: 10_000, strokeWidth: 15, streams: [0, 1] },
    ],
  );
});

test('keeps source branches and intermediate branches as separate links', () => {
  const tokenA = address('1');
  const tokenB = address('2');
  const tokenC = address('3');
  const tokenD = address('4');
  const model = buildRouteGraph([
    stream(5_000, [
      hop({ pool: address('301'), tokenIn: tokenA, tokenOut: tokenB }),
      hop({
        pool: address('302'),
        tokenIn: tokenB,
        tokenOut: tokenD,
      }),
    ]),
    stream(5_000, [
      hop({ pool: address('303'), tokenIn: tokenA, tokenOut: tokenC }),
      hop({
        pool: address('304'),
        tokenIn: tokenC,
        tokenOut: tokenD,
      }),
    ]),
  ]);

  assert.equal(model.nodes.length, 4);
  assert.equal(model.links.length, 4);
  assert.equal(model.nodes.filter((node) => node.depth === 1).length, 2);
});

test('aligns direct and multi-hop streams to the same output rail', () => {
  const tokenA = address('1');
  const tokenB = address('2');
  const tokenC = address('3');
  const model = buildRouteGraph([
    stream(5_000, [
      hop({ pool: address('310'), tokenIn: tokenA, tokenOut: tokenC }),
    ]),
    stream(5_000, [
      hop({ pool: address('311'), tokenIn: tokenA, tokenOut: tokenB }),
      hop({
        pool: address('312'),
        tokenIn: tokenB,
        tokenOut: tokenC,
      }),
    ]),
  ]);

  assert.equal(model.nodes.filter((node) => node.address === tokenC).length, 1);
  assert.ok(model.nodes.some((node) => node.id === `2:${tokenC}`));
  assert.ok(
    model.links.some(
      (link) => link.source === `0:${tokenA}` && link.target === `2:${tokenC}`,
    ),
  );
});

test('uses the fixed 15px line width from the Route design rules', () => {
  assert.deepEqual(
    [0, 1_000, 2_500, 5_000, 10_000].map(() => getRouteStrokeWidth()),
    [15, 15, 15, 15, 15],
  );
});

test('uses max(36px, line count × 15px + 16px) for node height', () => {
  const source = address('1');
  const model = buildRouteGraph([
    stream(5_000, [
      hop({ pool: address('313'), tokenIn: source, tokenOut: address('2') }),
    ]),
    stream(5_000, [
      hop({ pool: address('314'), tokenIn: source, tokenOut: address('3') }),
    ]),
  ]);

  assert.equal(getRouteGraphNodeHeight(`0:${source}`, model.links), 46);
  assert.equal(getRouteGraphNodeHeight(`1:${address('2')}`, model.links), 36);
});

test('keeps same-column nodes 20px apart', () => {
  const source = address('1');
  const target = address('4');
  const model = buildRouteGraph([
    stream(5_000, [
      hop({ pool: address('315'), tokenIn: source, tokenOut: address('2') }),
      hop({
        pool: address('316'),
        tokenIn: address('2'),
        tokenOut: target,
      }),
    ]),
    stream(5_000, [
      hop({ pool: address('317'), tokenIn: source, tokenOut: address('3') }),
      hop({
        pool: address('318'),
        tokenIn: address('3'),
        tokenOut: target,
      }),
    ]),
  ]);

  assert.equal(ROUTE_GRAPH_NODE_GAP, 20);
  assert.equal(ROUTE_GRAPH_LAYOUT_NODE_PADDING, 41);
  assert.equal(getRouteGraphLayoutHeight(model), 71);
  assert.equal(
    getRouteGraphLayoutHeight(model) + (36 - 15),
    36 + ROUTE_GRAPH_NODE_GAP + 36,
  );
});

test('shrinks token nodes to keep route columns readable on mobile', () => {
  assert.equal(getRouteGraphNodeWidth(661, 4), 100);
  assert.equal(getRouteGraphNodeWidth(319, 3), 64.75);
});

test('spaces route columns equally without SVG side gaps', () => {
  const bounds = Array.from({ length: 4 }, (_, depth) =>
    getRouteGraphColumnBounds(661, 3, depth, 100),
  );
  const mobileBounds = Array.from({ length: 4 }, (_, depth) =>
    getRouteGraphColumnBounds(319, 3, depth, 64.75),
  );
  const gaps = bounds
    .slice(1)
    .map(
      (column, index) => column.x - (bounds[index]!.x + bounds[index]!.width),
    );
  const mobileGaps = mobileBounds
    .slice(1)
    .map(
      (column, index) =>
        column.x - (mobileBounds[index]!.x + mobileBounds[index]!.width),
    );

  assert.deepEqual(
    bounds.map((column) => column.width),
    [36, 100, 100, 36],
  );
  gaps.forEach((gap) => assert.ok(Math.abs(gap - gaps[0]!) < 1e-9));
  mobileGaps.forEach((gap) => assert.ok(Math.abs(gap - mobileGaps[0]!) < 1e-9));
  assert.equal(bounds[0]!.x, 0);
  assert.equal(bounds.at(-1)!.x + bounds.at(-1)!.width, 661);
  assert.equal(mobileBounds[0]!.x, 0);
  assert.equal(mobileBounds.at(-1)!.x + mobileBounds.at(-1)!.width, 319);
});

test('spaces route columns equally without SVG side gaps', () => {
  const bounds = Array.from({ length: 4 }, (_, depth) =>
    getRouteGraphColumnBounds(661, 3, depth, 100),
  );
  const mobileBounds = Array.from({ length: 4 }, (_, depth) =>
    getRouteGraphColumnBounds(319, 3, depth, 64.75),
  );
  const gaps = bounds
    .slice(1)
    .map(
      (column, index) => column.x - (bounds[index]!.x + bounds[index]!.width),
    );
  const mobileGaps = mobileBounds
    .slice(1)
    .map(
      (column, index) =>
        column.x - (mobileBounds[index]!.x + mobileBounds[index]!.width),
    );

  assert.deepEqual(
    bounds.map((column) => column.width),
    [36, 100, 100, 36],
  );
  gaps.forEach((gap) => assert.ok(Math.abs(gap - gaps[0]!) < 1e-9));
  mobileGaps.forEach((gap) => assert.ok(Math.abs(gap - mobileGaps[0]!) < 1e-9));
  assert.equal(bounds[0]!.x, 0);
  assert.equal(bounds.at(-1)!.x + bounds.at(-1)!.width, 661);
  assert.equal(mobileBounds[0]!.x, 0);
  assert.equal(mobileBounds.at(-1)!.x + mobileBounds.at(-1)!.width, 319);
});

test('spreads endpoint links with a 20px visible gap before they converge', () => {
  const anchors = spreadRouteEndpointAnchors(
    [
      { id: 'top', desiredY: 100, strokeWidth: 15 },
      { id: 'middle', desiredY: 115, strokeWidth: 15 },
      { id: 'bottom', desiredY: 130, strokeWidth: 15 },
    ],
    540,
  );

  assert.deepEqual(
    ['top', 'middle', 'bottom'].map((id) => anchors.get(id)),
    [80, 115, 150],
  );
  assert.equal(anchors.get('middle')! - anchors.get('top')! - 15, 20);
  assert.equal(anchors.get('bottom')! - anchors.get('middle')! - 15, 20);
});

test('preserves endpoint anchors that already have enough space', () => {
  const anchors = spreadRouteEndpointAnchors(
    [
      { id: 'wbnb', desiredY: 150, strokeWidth: 15 },
      { id: 'eth', desiredY: 300, strokeWidth: 15 },
    ],
    400,
  );

  assert.equal(anchors.get('wbnb'), 150);
  assert.equal(anchors.get('eth'), 300);
});

test('keeps endpoint line edges inside the 40px safe area', () => {
  const anchors = spreadRouteEndpointAnchors(
    [
      { id: 'top', desiredY: 0, strokeWidth: 15 },
      { id: 'bottom', desiredY: 540, strokeWidth: 15 },
    ],
    540,
  );

  assert.equal(ROUTE_GRAPH_ENDPOINT_PADDING, 40);
  assert.equal(anchors.get('top')! - 15 / 2, 40);
  assert.equal(anchors.get('bottom')! + 15 / 2, 500);
});

test('aligns the same protocol and stream on both sides of a token node', () => {
  const anchors = alignRouteNodeLinkAnchors(
    [
      {
        id: 'uniswap-in',
        desiredY: 100,
        providerCode: 'UNISWAPV3',
        side: 'incoming',
        sortY: 130,
        streamIndexes: [1],
        strokeWidth: 15,
      },
      {
        id: 'pancake-in',
        desiredY: 115,
        providerCode: 'PANCAKEV3',
        side: 'incoming',
        sortY: 115,
        streamIndexes: [2],
        strokeWidth: 15,
      },
      {
        id: 'uniswap-out',
        desiredY: 130,
        providerCode: 'UNISWAPV3',
        side: 'outgoing',
        sortY: 100,
        streamIndexes: [1],
        strokeWidth: 15,
      },
    ],
    80,
    60,
  );

  assert.equal(anchors.get('uniswap-in'), anchors.get('uniswap-out'));
  assert.notEqual(anchors.get('uniswap-in'), anchors.get('pancake-in'));
  assert.ok(anchors.get('uniswap-out')! < anchors.get('pancake-in')!);
});

test('places direct routes on matching top and bottom lanes', () => {
  const lanes = distributeDirectRouteLanes(
    Array.from({ length: 4 }, (_, index) => ({
      id: `direct-${index}`,
      order: index,
      strokeWidth: 15,
    })),
    [{ id: 'middle', x: 280, y: 100, width: 100, height: 100 }],
    300,
  );

  assert.deepEqual(
    Array.from({ length: 4 }, (_, index) => lanes.get(`direct-${index}`)),
    [47.5, 82.5, 217.5, 252.5],
  );
});

test('keeps a route that skips token columns as one continuous layout link', () => {
  const model = buildRouteGraph([
    stream(5_000, [
      hop({
        pool: address('320'),
        tokenIn: address('1'),
        tokenOut: address('3'),
      }),
    ]),
    stream(5_000, [
      hop({
        pool: address('321'),
        tokenIn: address('1'),
        tokenOut: address('2'),
      }),
      hop({
        pool: address('322'),
        tokenIn: address('2'),
        tokenOut: address('3'),
      }),
    ]),
  ]);
  const expanded = buildRouteGraphLayoutModel(model);
  assert.equal(
    expanded.links.filter((link) => link.routeLinkId === model.links[0]?.id)
      .length,
    1,
  );
});

test('uses one soft cubic for an unobstructed route', () => {
  const path = getRouteGraphLinkPath(
    {
      source: 'source',
      target: 'target',
      sourceX: 44,
      sourceY: 100,
      targetX: 617,
      targetY: 120,
      strokeWidth: 15,
    },
    [],
    300,
  );

  assert.equal(path, 'M44,100 C330.5,100 330.5,120 617,120');
  assert.equal((path.match(/ C/g) ?? []).length, 1);
});

test('uses one seamless symmetric detour on the source side of a blocking token', () => {
  const path = getRouteGraphLinkPath(
    {
      source: 'source',
      target: 'target',
      sourceX: 44,
      sourceY: 150,
      targetX: 617,
      targetY: 150,
      strokeWidth: 15,
    },
    [{ id: 'middle', x: 280, y: 130, width: 100, height: 40 }],
    300,
  );

  assert.equal((path.match(/M/g) ?? []).length, 1);
  assert.equal((path.match(/C/g) ?? []).length, 2);
  assert.equal((path.match(/L/g) ?? []).length, 1);
  assert.equal(
    path,
    'M44,150 C110,150 98,181.5 164,181.5 L497,181.5 C563,181.5 551,150 617,150',
  );
});

test('routes a lower source below a same-height intermediate token', () => {
  const link = {
    source: 'eth',
    target: 'target',
    sourceX: 200,
    sourceY: 150,
    targetX: 600,
    targetY: 100,
    strokeWidth: 15,
  };
  const nodes = [{ id: 'usdc', x: 350, y: 125, width: 100, height: 50 }];
  const path = getRouteGraphLinkPath(link, nodes, 300);

  assert.match(path, /,186\.5 L.*?,186\.5 C/);
  assert.equal(
    getRouteGraphBypassLaneY({ ...link, targetY: link.sourceY }, nodes, 300),
    186.5,
  );
});

test('prefers a nearby gap between nodes over routing around the graph edge', () => {
  const path = getRouteGraphLinkPath(
    {
      source: 'source',
      target: 'target',
      sourceX: 44,
      sourceY: 80,
      targetX: 617,
      targetY: 220,
      strokeWidth: 15,
    },
    [
      { id: 'top', x: 200, y: 50, width: 100, height: 40 },
      { id: 'bottom', x: 360, y: 190, width: 100, height: 40 },
    ],
    300,
  );

  assert.match(path, /,150 L.*?,150 C/);
});

test('deduplicates legend providers and gives unknown providers a stable fallback color', () => {
  const model = buildRouteGraph([
    stream(5_000, [hop({ providerCode: 'PANCAKEV3' })]),
    stream(5_000, [
      hop({
        providerCode: 'pancakev3',
        pool: address('401'),
      }),
      hop({
        providerCode: 'NEW_DEX',
        pool: address('402'),
        tokenIn: address('2'),
        tokenOut: address('3'),
      }),
    ]),
  ]);

  assert.deepEqual(model.providerCodes, ['PANCAKEV3', 'NEW_DEX']);
  assert.equal(getRouteProviderColor('PANCAKEV3'), '#2A4D8DCC');
  assert.equal(
    getRouteProviderColor('NEW_DEX'),
    getRouteProviderColor('new_dex'),
  );
});

test('assigns distinct high-contrast colors to providers in the same quote', () => {
  const providerCodes = [
    'PANCAKEV3',
    'UNISWAPV3',
    'LISTA_STABLE',
    'DODO',
    'NEW_DEX',
  ];
  const colors = getRouteProviderColorMap(providerCodes);

  assert.equal(colors.PANCAKEV3, '#2A4D8DCC');
  assert.equal(colors.UNISWAPV3, '#4B2A8DCC');
  assert.equal(colors.LISTA_STABLE, '#39B3FFCC');
  assert.equal(colors.DODO, '#FFD38DCC');
  assert.equal(new Set(Object.values(colors)).size, providerCodes.length);
  assert.deepEqual(colors, getRouteProviderColorMap(providerCodes));
});

test('keeps intentional shared colors from the protocol color design', () => {
  const colors = getRouteProviderColorMap([
    'PANCAKEV3',
    'PANCAKE_INFINITY_CL',
    'UNISWAPV4',
    'THENAV3',
  ]);

  assert.equal(colors.PANCAKEV3, colors.PANCAKE_INFINITY_CL);
  assert.equal(colors.UNISWAPV4, colors.THENAV3);
});

test('uses the Figma color for every specified protocol', () => {
  const expectedColors = {
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

  assert.deepEqual(
    getRouteProviderColorMap(Object.keys(expectedColors)),
    expectedColors,
  );
});

test('keeps fixed-width route bands in stream order', () => {
  const model = buildRouteGraph([
    stream(1_000, [hop({ pool: address('501') })]),
    stream(9_000, [hop({ pool: address('502') })]),
  ]);
  const sortedLinks = sortRouteGraphLinksForDisplay(model.links);

  assert.deepEqual(
    sortedLinks.map((link) => link.strokeWidth),
    [15, 15],
  );
});

test('grows beyond the 540px viewport when a graph column is too tall', () => {
  const source = address('1');
  const target = address('999');
  const streams = Array.from({ length: 12 }, (_, index) => {
    const middle = address(String(index + 10));
    return stream(500, [
      hop({
        pool: address(String(index + 500)),
        tokenIn: source,
        tokenOut: middle,
      }),
      hop({
        pool: address(String(index + 700)),
        tokenIn: middle,
        tokenOut: target,
      }),
    ]);
  });
  const model = buildRouteGraph(streams);

  assert.equal(getRouteGraphContentHeight(model), 652);
  assert.equal(
    getRouteGraphViewportHeight(getRouteGraphContentHeight(model)),
    ROUTE_GRAPH_MAX_VIEWPORT_HEIGHT,
  );
});

test('grows to keep endpoint link slots 20px apart', () => {
  const source = address('1');
  const target = address('2');
  const streams = Array.from({ length: 17 }, (_, index) =>
    stream(500, [
      hop({
        pool: address(String(index + 800)),
        tokenIn: source,
        tokenOut: target,
      }),
    ]),
  );

  assert.equal(getRouteGraphContentHeight(buildRouteGraph(streams)), 655);
});

test('uses the route content height until the 540px graph viewport cap', () => {
  const model = buildRouteGraph([
    stream(10_000, [
      hop({
        pool: address('900'),
        tokenIn: address('1'),
        tokenOut: address('2'),
      }),
    ]),
  ]);
  const contentHeight = getRouteGraphContentHeight(model, 0);

  assert.equal(contentHeight, 95);
  assert.equal(getRouteGraphViewportHeight(contentHeight), 95);
  assert.equal(getRouteGraphViewportHeight(652), 540);
});
