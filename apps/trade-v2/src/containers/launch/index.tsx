import Operation from './operation';
import Steps from './Steps';

const Launch = () => {
  return (
    <div className="flex justify-center gap-30 pb-2 text-xs">
      <Steps className="max-w-[380px]" />
      <Operation className="h-full max-w-[680px] grow" />
    </div>
  );
};

export default Launch;
