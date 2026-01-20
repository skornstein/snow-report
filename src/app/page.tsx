import SnowWidget from '@/components/SnowWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">Live Snow & Ski Conditions Widget</h1>
          <p className="text-slate-600">Embeddable widget for ValleyViewVT.com</p>
        </header>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="bg-slate-50 p-8 rounded border border-dashed border-slate-300">
            <SnowWidget />
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-xl font-semibold">Embed Instructions</h2>
          <div className="prose prose-slate">
            <p>To embed this widget on WordPress (Elementor or Classic):</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Create a <strong>HTML Code</strong> block or widget.</li>
              <li>Paste the following iframe code:</li>
            </ol>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto text-sm">
              {`<iframe 
  src="https://your-deploy-url.vercel.app/widget?mountain=mount-snow" 
  width="100%" 
  height="600" 
  frameborder="0" 
  scrolling="no"
  style="border:none; overflow:hidden;"
></iframe>`}
            </pre>
            <p className="text-sm text-slate-500 mt-2">
              Adjust <code>height</code> as needed. The widget is responsive.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
