export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import HomePage from '@/components/HomePage';

type CatchAllPageProps = {
  params: {
    slug: string[];
  };
};

export default function CatchAllPage(_props: CatchAllPageProps) {
  return <HomePage />;
}
