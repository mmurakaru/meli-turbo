import { Terminal } from '@/app/(dashboard)/terminal';

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Edit Tour {slug}</h1>

      <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
        <Terminal tourId={slug} />
      </div>
    </section>
  );
}
