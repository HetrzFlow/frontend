export const scrollWithinContainer = ({
  container,
  target,
  align = 'start',
  offset = 0,
}: {
  container: HTMLElement;
  target: HTMLElement;
  align?: 'start' | 'center';
  offset?: number;
}) => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetTop =
    container.scrollTop + targetRect.top - containerRect.top - offset;
  const top =
    align === 'center'
      ? targetTop - (container.clientHeight - targetRect.height) / 2
      : targetTop;

  container.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  });
};
