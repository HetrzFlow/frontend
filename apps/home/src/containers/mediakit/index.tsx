import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';
import { Button } from '@repo/ui';

interface MediaKitResource {
  id: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  };
  downloadLink: string;
}

const MediaKitHero = () => {
  const { t } = useLingui();

  return (
    <div className="mx-auto max-w-[600px] text-center max-md:mx-0 max-md:max-w-none max-md:text-left">
      <h1
        id="media-kit-title"
        className="text-t-1100 text-[52px] leading-none font-medium max-md:text-2xl"
      >{t`Media Kit`}</h1>
      <p className="text-t-270 mt-3 text-sm max-md:text-sm">{t`Access official HertzFlow brand resources, visual assets, and usage guidelines for media coverage, partnerships, campaigns, and community communications.`}</p>
    </div>
  );
};

const MediaKitResourceCard = ({ resource }: { resource: MediaKitResource }) => {
  const { t } = useLingui();

  return (
    <article className="border-border bg-bg-2 flex flex-col rounded-2xl border p-2">
      <div className="relative flex h-60 shrink-0 grow-0 items-center justify-center overflow-hidden rounded-xl">
        <Image
          src={resource.image.src}
          alt={resource.image.alt}
          width={resource.image.width}
          height={resource.image.height}
          className={resource.image.className}
        />
      </div>
      <div className="flex grow flex-col px-1 pt-4 pb-1">
        <h2 className="text-t-1100 text-base font-medium">{resource.title}</h2>
        <p className="text-t-270 my-4 min-h-[51px] text-sm">
          {resource.description}
        </p>
        <a
          href={resource.downloadLink}
          download
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            className="border-accent text-accent hover:text-accent/80 mt-auto h-9 w-max rounded-xl bg-transparent px-6 text-sm font-medium hover:bg-transparent"
          >{t`Download`}</Button>
        </a>
      </div>
    </article>
  );
};

const MediaKitResourceGrid = () => {
  const { t } = useLingui();
  const resources: MediaKitResource[] = [
    {
      id: 'logos',
      title: t`Logos`,
      description: t`Download approved HertzFlow logo files in multiple formats and variations for use across digital, print, partnership, and media materials.`,
      image: {
        src: '/home-static/mediakit/logo.png',
        alt: t`HertzFlow logo preview`,
        width: 1000,
        height: 1000,
        className: 'relative z-10 h-full w-full object-cover',
      },
      downloadLink: '/home-static/mediakit/hertzflow_mediakit_logo.zip',
    },
    {
      id: 'social-assets',
      title: t`Social Media Assets`,
      description: t`Download ready-to-use branded visuals for social posts, campaign announcements, community updates, and other public-facing communications.`,
      image: {
        src: '/home-static/mediakit/social-media.png',
        alt: t`HertzFlow social media assets preview`,
        width: 1000,
        height: 1000,
        className: 'relative z-10 h-full w-full object-cover',
      },
      downloadLink: '/home-static/mediakit/herzflow_mediakit_assets.zip',
    },
  ];

  return (
    <div className="mt-[90px] grid grid-cols-3 gap-2 max-md:mt-5 max-md:grid-cols-1">
      {resources.map((resource) => (
        <MediaKitResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
};

const MediaKit = () => {
  return (
    <main className="relative mx-auto min-h-dvh max-w-[1440px] overflow-hidden bg-black px-20 pt-[180px] pb-16 max-md:px-4 max-md:pt-[100px] max-md:pb-[60px]">
      <Image
        src="/home-static/mediakit/bg.png"
        alt=""
        width={991}
        height={279}
        priority
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-[279px] w-[991px] max-w-none -translate-x-1/2 object-cover max-md:-left-10 max-md:h-[200px] max-md:w-[596px] max-md:translate-x-0"
      />

      <section
        aria-labelledby="media-kit-title"
        className="relative mx-auto max-w-[1080px]"
      >
        <MediaKitHero />
        <MediaKitResourceGrid />
      </section>
    </main>
  );
};

export default MediaKit;
