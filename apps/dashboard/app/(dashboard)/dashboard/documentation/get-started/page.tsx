import { Terminal } from '@/app/(dashboard)/_components/terminal';

export default async function GetStartedPage() {
  return (
    <section className="flex-1">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Get started</h1>

      <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:col-start-4 lg:flex lg:items-center">
        <Terminal tourId="{id}" />
      </div>
    </section>
  );
}
