import Image from 'next/image';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { productDoc } from '@repo/common/constants';
import { useNavItems } from '@repo/common/hooks';
import { Button, Separator } from '@repo/ui';
import BannerVideo from '@/components/BannerVideo';
import ComingSoon from '@/components/ComingSoon';

const Banner = () => {
  const navItems = useNavItems();

  return (
    <div className="relative mx-auto mt-19.5 max-w-[1440px] px-20 max-md:max-w-dvw max-md:px-4 lg:overflow-x-visible">
      <div className="w-full">
        <BannerVideo className="h-[calc(100dvh-78px)] w-full" />
      </div>

      <div className="absolute right-20 bottom-25 left-20 flex justify-between gap-10 max-md:right-4 max-md:bottom-10 max-md:left-4 max-md:flex-col">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-t-270">{i18n._(msg`Built on`)}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="92"
              height="16"
              viewBox="0 0 92 16"
              fill="none"
            >
              <path
                d="M2.66788 2.46743L6.93212 0L11.1964 2.46743L9.59635 3.33485L6.93212 1.80046L4.19863 3.33485L2.66788 2.46743ZM11.1308 5.53257L9.59635 4.66515L6.93212 6.19954L4.19863 4.66515L2.66424 5.53257V7.33303L5.33212 8.86743V12.0018L6.86651 12.9349L8.40091 12.0018V8.93667L11.0688 7.40228V5.53622H11.1308V5.53257ZM11.1308 10.4674V8.66697L9.59635 9.6V11.3312L11.1308 10.4674ZM12.2642 11.0651L9.6 12.5995V14.4L13.8679 11.9326V7.00137L12.2679 8L12.2642 11.0651ZM10.7298 4.00182L12.2642 4.93485V6.73531L13.7986 5.80228V4.00182L12.2642 3.06879L10.7298 4.00182ZM5.33212 13.2665V15.067L6.86651 16L8.40091 15.067V13.2665L6.86651 14.1995L5.33212 13.2665ZM2.66424 10.4674L4.19863 11.3349V9.5344L2.66424 8.60137V10.4674ZM5.33212 4.00182L6.86651 4.93485L8.46651 4.00182L6.93212 3.06879L5.33212 4.00182ZM1.5344 4.93485L3.1344 4.00182L1.5344 3.06879L0 4.00182V5.80228L1.5344 6.73531V4.93485ZM1.5344 8L0 7.06697V11.9982L4.26788 14.4656V12.6651L1.6 11.1308V7.99636L1.5344 8Z"
                fill="#F0B90B"
              />
              <path
                d="M26.1282 10.0664C26.1282 8.86734 25.4612 8.26598 24.4626 7.86507C25.1296 7.5334 25.6617 6.93204 25.6617 5.9334C25.6617 4.53386 24.5282 3.60083 22.7278 3.60083H18.5947V12.5339H22.859C24.7943 12.4646 26.1282 11.6664 26.1282 10.0664ZM23.6608 6.26507C23.6608 6.93204 23.1287 7.1981 22.2612 7.1981H20.4608V5.26643H22.3924C23.2635 5.26643 23.6608 5.60174 23.6608 6.26507ZM24.1965 9.80037C24.1965 10.4673 23.6644 10.799 22.797 10.799H20.4644V8.86734H22.7314C23.73 8.7981 24.1965 9.19901 24.1965 9.80037Z"
                fill="#F0B90B"
              />
              <path
                d="M35.794 12.4646V3.60083H33.8587V9.0678L29.6601 3.60083H27.8633V12.5339H29.7949V6.86643L34.1284 12.5339H35.794V12.4646Z"
                fill="#F0B90B"
              />
              <path
                d="M45.5911 10.0664C45.5911 8.86734 44.9241 8.26598 43.9255 7.86507C44.5925 7.5334 45.1246 6.93204 45.1246 5.9334C45.1246 4.53386 43.9911 3.60083 42.1906 3.60083H38.0576V12.5339H42.3219C44.2572 12.4646 45.5911 11.6664 45.5911 10.0664ZM43.1929 6.26507C43.1929 6.93204 42.6608 7.1981 41.7934 7.1981H39.9929V5.26643H41.9246C42.7264 5.26643 43.1929 5.60174 43.1929 6.26507ZM43.6594 9.80037C43.6594 10.4673 43.1273 10.799 42.2599 10.799H39.9273V8.86734H42.1943C43.1929 8.7981 43.6594 9.19901 43.6594 9.80037Z"
                fill="#F0B90B"
              />
              <path
                d="M57.389 10.934L56.3904 9.93536C55.6578 10.6679 54.9252 11.0688 53.8574 11.0688C52.1225 11.0688 50.9234 9.6693 50.9234 7.86885C50.9234 6.134 52.1918 4.7381 53.8574 4.7381C54.856 4.7381 55.6578 5.20461 56.3248 5.87158L57.3234 4.67249C56.456 3.87432 55.4574 3.27295 53.8574 3.27295C51.1895 3.27295 49.2578 5.33946 49.2578 7.87249C49.2578 10.4711 51.1895 12.472 53.7918 12.472C55.4574 12.4647 56.456 11.867 57.389 10.934Z"
                fill="#F0B90B"
              />
              <path
                d="M64.9881 8.6013V12.3334H66.5225V3.40039H64.9881V7.13251H60.7238V3.40039H59.1895V12.3334H60.7238V8.6013H64.9881Z"
                fill="#F0B90B"
              />
              <path
                d="M73.5852 3.40039H72.1201L68.1875 12.399H69.7875L70.7205 10.2669H74.9192L75.8522 12.399H77.5178L73.5852 3.40039ZM74.387 8.79811H71.3219L72.8563 5.26645L74.387 8.79811Z"
                fill="#F0B90B"
              />
              <path
                d="M79.2529 3.40039V12.3334H80.7837V3.40039H79.2529Z"
                fill="#F0B90B"
              />
              <path
                d="M89.516 9.59993L84.7159 3.46599H83.3164V12.399H84.8508V5.99902L89.782 12.3334H91.116V3.40039H89.5816V9.59993H89.516Z"
                fill="#F0B90B"
              />
            </svg>
            <Separator orientation="vertical" className="mx-1" />
            <span className="text-t-270">{i18n._(msg`Backed by`)}</span>
            <Image
              src="/home-static/images/yzi-labs.png"
              alt="yzi labs"
              fetchPriority="high"
              width={295}
              height={72}
              className="h-[18px] w-auto"
            />
          </div>
          <h1 className="edge font-borna mt-8 text-[56px] leading-tight font-medium max-md:text-[32px]">
            {i18n._(msg`World Leverage Engine.`)}
            <br />
            {i18n._(msg`Built For You to Win.`)}
          </h1>
        </div>
        <div className="w-[372px] max-md:w-full">
          <div>
            {i18n._(
              msg`Trade & Earn on any asset with leverage - 100% self-custodial.`,
            )}
          </div>
          <div className="mt-6 flex gap-3">
            {navItems.trade.link ? (
              <a
                href={navItems.trade.link}
                rel="noopener noreferrer"
                className="w-[calc(50%-6px)]"
              >
                <Button
                  variant="accent"
                  className="group hover:bg-accent h-[49px] w-full text-sm"
                >
                  <div className="flex gap-4">
                    <span className="w-0"></span>
                    {i18n._(msg`Start Trading`)}
                    <span className="w-0 overflow-hidden text-left transition-[width] duration-300 group-hover:w-8">
                      →
                    </span>
                  </div>
                </Button>
              </a>
            ) : (
              <ComingSoon
                className="w-[calc(50%-6px)]"
                popupClassName={'left-1/2 -translate-x-1/2 top-15'}
              >
                <Button
                  variant="accent"
                  className="group hover:bg-accent h-[49px] w-full cursor-not-allowed text-sm font-medium"
                >
                  <div className="flex gap-4">
                    <span className="w-0"></span>
                    {i18n._(msg`Start Trading`)}
                    <span className="w-0 overflow-hidden text-left transition-[width] duration-300 group-hover:w-8">
                      →
                    </span>
                  </div>
                </Button>
              </ComingSoon>
            )}
            <a
              href={productDoc}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[calc(50%-6px)]"
            >
              <Button
                variant="outline"
                className="h-[49px] w-full border-white bg-transparent text-sm hover:border-white/70 hover:bg-white hover:text-black"
              >
                {i18n._(msg`Documentation`)}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
