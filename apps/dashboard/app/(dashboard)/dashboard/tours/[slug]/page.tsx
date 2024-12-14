export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-extrabold mb-6">Edit Tour {slug}</h1>
    </section>
  );
}
