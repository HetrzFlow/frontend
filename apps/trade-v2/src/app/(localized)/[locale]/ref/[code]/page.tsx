import { redirect } from 'next/navigation';

const Page = async (
  props: Readonly<{
    params: Promise<{ locale: string; code: string }>;
  }>,
) => {
  const { locale, code } = await props.params;

  redirect(`/${locale}/referral?ref=${encodeURIComponent(code)}`);
};

export default Page;
