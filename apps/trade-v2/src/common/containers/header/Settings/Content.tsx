import { FC, useCallback, useRef, useState } from 'react';
import NetworkPanel from './NetworkPanel';
import NetworkSwitch from './NetworkSwitch';
import PanelLayout from './PanelLayout';

const Content: FC<{ panelId?: string }> = ({ panelId: _panelId = '' }) => {
  const [panelId, setPanelId] = useState<string>(_panelId);
  const firstInRef = useRef(true);
  const [open, setOpen] = useState(true);

  const changePanelId = useCallback((panelId: string) => {
    firstInRef.current = false;
    setOpen(panelId === '');
    setTimeout(() => {
      setPanelId(panelId);
    }, 250);
  }, []);

  if (panelId === 'Network') {
    return (
      <PanelLayout close={open} onBack={() => changePanelId('')}>
        <NetworkPanel onBack={() => changePanelId('')} />
      </PanelLayout>
    );
  }

  return (
    <PanelLayout
      disabledInAnimation={firstInRef.current}
      close={!open}
      className={'gap-0'}
      showBack={false}
    >
      <NetworkSwitch
        onClick={() => {
          changePanelId('Network');
        }}
      />
    </PanelLayout>
  );
};

export default Content;
