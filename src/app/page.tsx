import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Sparkles, Heart } from "lucide-react";



const COMMUNITY_POSTS = [
  {
    type: "ootd",
    user: "Emily R.",
    content: "Sunday Service Fit 🎀",
    sub: "#modestfashion",
    likes: 243,
    color: "bg-sage-green/20"
  },
  {
    type: "verse",
    content: "\"Be still, and know that I am God.\"",
    sub: "Psalm 46:10",
    color: "bg-soft-blush/30"
  },
  {
    type: "prayer",
    user: "Sarah J.",
    content: "Praying for peace during finals week. 🙏",
    sub: "12 Praying",
    color: "bg-white/60"
  },
  {
    type: "ootd",
    user: "Mia K.",
    content: "Coffee date look ☕️",
    sub: "#cozy",
    likes: 189,
    color: "bg-warm-cocoa/10"
  },
  {
    type: "verse",
    content: "\"She is clothed with strength and dignity...\"",
    sub: "Proverbs 31:25",
    color: "bg-muted-rose/20"
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-soft-blush rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-80 h-80 bg-sage-green rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-80 h-80 bg-muted-rose/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8 animate-fade-in-up">
            <Image
              src="/logo.png"
              alt="Selahly Lotus Logo"
              width={120}
              height={120}
              className="opacity-90"
            />
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-warm-grey mb-6 tracking-tight animate-fade-in-up animation-delay-100">
            Selahly
          </h1>

          <p className="max-w-xl mx-auto text-lg md:text-xl text-warm-grey/70 mb-10 leading-relaxed text-balance animate-fade-in-up animation-delay-200">
            Your digital sanctuary. A pause from the noise to connect, grow, and be known.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300 w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Join the Circle
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Feed */}
      <section className="py-12 bg-gradient-to-t from-white/40 to-transparent">
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-warm-cocoa uppercase tracking-widest opacity-60">Happening inside Selahly ౨ৎ</p>
        </div>

        <Marquee pauseOnHover className="[--duration:40s] [--gap:1.5rem]">
          {COMMUNITY_POSTS.map((post, i) => (
            <div key={i} className={`glass-card rounded-2xl p-5 w-64 shrink-0 hover:-translate-y-1 transition-transform cursor-default ${post.color}`}>
              {post.type === 'verse' ? (
                <div className="text-center h-full flex flex-col justify-center">
                  <Sparkles className="w-4 h-4 text-warm-cocoa/40 mx-auto mb-2" />
                  <p className="font-serif text-lg text-warm-grey mb-2">{post.content}</p>
                  <p className="text-xs text-warm-cocoa uppercase tracking-wider">{post.sub}</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-serif">
                      {post.user ? post.user.charAt(0) : 'S'}
                    </div>
                    <span className="text-xs font-medium text-warm-grey/60">{post.user}</span>
                  </div>
                  <p className="font-serif text-base text-warm-grey mb-auto">{post.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                    <span className="text-[10px] text-warm-grey/40">{post.sub}</span>
                    {post.likes && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-rose">
                        <Heart className="w-3 h-3 fill-current" /> {post.likes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </Marquee>
      </section>




      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl text-warm-grey mb-6">
            What is <span className="italic text-muted-rose">Selahly</span>?
          </h2>
          <p className="text-lg text-warm-grey/80 leading-relaxed mb-8 max-w-2xl mx-auto">
            "Selah" means to pause and reflect. <br />
            We built Selahly because the internet is loud, and girls deserve a quiet place to hear God's voice and find true friends. It's a social app, but without the pressure. No algorithms, no influencers—just sisterhood.
          </p>
        </div>
      </section>

      {/* Why Join Grid */}
      <section className="py-20 px-4 bg-white/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 mx-auto bg-soft-blush rounded-full flex items-center justify-center mb-6 text-2xl">☁️</div>
              <h3 className="font-serif text-2xl text-warm-grey mb-3">A Safe Space</h3>
              <p className="text-warm-grey/70">A private, moderated community where you can share your heart without fear of judgment or negativity.</p>
            </div>
            <div className="glass-card p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-transform duration-500 delay-100">
              <div className="w-16 h-16 mx-auto bg-sage-green rounded-full flex items-center justify-center mb-6 text-2xl">🎀</div>
              <h3 className="font-serif text-2xl text-warm-grey mb-3">Sisterhood</h3>
              <p className="text-warm-grey/70">Find friends who share your values. From prayer requests to outfit checks, we do life together.</p>
            </div>
            <div className="glass-card p-8 rounded-[2rem] text-center hover:-translate-y-2 transition-transform duration-500 delay-200">
              <div className="w-16 h-16 mx-auto bg-warm-paper border border-warm-cocoa/10 rounded-full flex items-center justify-center mb-6 text-2xl">🕯️</div>
              <h3 className="font-serif text-2xl text-warm-grey mb-3">Daily Growth</h3>
              <p className="text-warm-grey/70">Start every morning with a short, aesthetic devotional designed to help you connect with Jesus.</p>
            </div>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-serif text-3xl md:text-4xl text-warm-grey mb-12 text-center">Common Questions</h2>

          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-serif text-lg text-warm-grey mb-2 flex items-center gap-2">
                <span className="text-muted-rose">01.</span> Is Selahly free?
              </h3>
              <p className="text-warm-grey/70 pl-8">Yes! The core community, daily devotionals, and posting are completely free. We want every girl to have access to this sanctuary.</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-serif text-lg text-warm-grey mb-2 flex items-center gap-2">
                <span className="text-muted-rose">02.</span> Who is this for?
              </h3>
              <p className="text-warm-grey/70 pl-8">Selahly is designed primarily for teenage girls & young women (ages 13-25) looking for a faith-based community.</p>
            </div>
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-serif text-lg text-warm-grey mb-2 flex items-center gap-2">
                <span className="text-muted-rose">03.</span> Is it safe?
              </h3>
              <p className="text-warm-grey/70 pl-8">Absolutely. We have strict community guidelines and moderation to ensure kindness, modesty, and support are always prioritized.</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/transition?to=signup">
              <Button size="lg" className="px-12">
                Join the Circle
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
