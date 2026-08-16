import { FC, useCallback, useRef, useState } from 'react';
import { cn } from '@repo/ui';
import { OnboardSwitch } from './OnboardSwitch';
import PanelLayout from './PanelLayout';
import SuiNetworkPanel from './SuiNetworkPanel';
import SuiNetworkSwitch from './SuiNetworkSwitch';
import SuiRPCPanel from './SuiRPCPanel';
import SuiRPCSwitch from './SuiRPCSwitch';
import ThemeSwitch from './ThemeSwitch';

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

  if (panelId === 'suiNetwork') {
    return (
      <PanelLayout close={open} onBack={() => changePanelId('')}>
        <SuiNetworkPanel onBack={() => changePanelId('')} />
      </PanelLayout>
    );
  }

  if (panelId === 'suiRPC') {
    return (
      <PanelLayout close={open} onBack={() => changePanelId('')}>
        <SuiRPCPanel onBack={() => changePanelId('')} />
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
      <ThemeSwitch />
      <OnboardSwitch />
      <SuiNetworkSwitch
        onClick={() => {
          changePanelId('suiNetwork');
        }}
      />
      <SuiRPCSwitch
        onClick={() => {
          changePanelId('suiRPC');
        }}
      />
    </PanelLayout>
  );
};

export default Content;
