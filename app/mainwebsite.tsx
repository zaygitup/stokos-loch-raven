export default function MainWebsite() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-black text-black dark:text-white">
          Welcome to Stoko&apos;s
        </h1>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Choose your nearest location to start ordering.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <a href="/store/towson" className="rounded-full bg-green-800 px-6 py-3 font-bold text-white">
            Towson
          </a>

          <a href="/store/york" className="rounded-full bg-green-800 px-6 py-3 font-bold text-white">
            York
          </a>

          <a href="/store/liberty" className="rounded-full bg-green-800 px-6 py-3 font-bold text-white">
            Liberty
          </a>
        </div>
      </section>
    </main>
  );
}