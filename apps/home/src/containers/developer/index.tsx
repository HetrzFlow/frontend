import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { githubDoc, skillSite } from '@repo/common/constants';
import { Button } from '@repo/ui';
import SplitText from '@/components/SplitText';
import AnimateCube from './AnimateCube';

const Developer = () => {
  return (
    <div className="mx-auto mt-20 flex max-w-[1440px] items-center gap-35 px-20 max-md:mt-15 max-md:max-w-dvw max-md:flex-col max-md:px-4 lg:mt-10 lg:overflow-x-visible">
      <div className="w-125 max-md:w-full">
        <h2 className="">
          <SplitText
            text={i18n._(msg`For Humans and Agents`)}
            className="font-borna overflow-visible text-[calc(var(--spacing)*7)]/[1.2] font-medium lg:text-[52px]/[1]"
            delay={10}
            duration={2}
            ease="elastic.out(1, 0.3)"
            splitType="words, chars"
            threshold={0}
            textAlign="left"
          />
        </h2>
        <p className="text-t-270 mt-6 text-sm max-md:mt-3">
          {i18n._(
            msg`Build on our leverage engine with a robust SDK, deep liquidity, and real-time data. From seamless integration to launching custom platforms, our DevRel team is here to fuel your innovation.`,
          )}
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href={githubDoc || 'https://'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-45"
          >
            <Button variant="accent" className="h-[49px] w-full text-sm">
              {i18n._(msg`Github`)}
            </Button>
          </a>
          <a
            href={skillSite || 'https://'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-45"
          >
            <Button
              variant="outline"
              className="hover:text-t-270 h-[49px] w-full border-white text-sm hover:border-white/70 hover:bg-transparent"
            >
              {i18n._(msg`Skills`)}
            </Button>
          </a>
        </div>
      </div>
      <div className="flex w-1/2 justify-center max-md:w-full">
        <AnimateCube />
      </div>
    </div>
  );
};

export default Developer;
