import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { LandingReveal } from "@/components/LandingReveal";
import { getSessionUser } from "@/lib/auth";
import styles from "./landing.module.css";

/** The landing route only decides where to send you, so it must read the cookie per request. */
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const events = [
    ["09:03", "Checked in", "Attendance"],
    ["11:40", "Leave approved", "People"],
    ["16:15", "Payroll ready", "Finance"],
  ];

  return (
    <main className={styles.page} data-landing>
      <LandingReveal />
      <nav className={styles.nav} aria-label="Main navigation">
        <Link className={styles.brand} href="/" aria-label="Dayflow home">
          <Image
            className={styles.brandLogo}
            src="/brand/dayflow-logo.png"
            alt="Dayflow"
            width={140}
            height={44}
            priority
          />
        </Link>
        <div className={styles.navLinks}>
          <a href="#product">Product</a>
          <a href="#why-dayflow">Why Dayflow</a>
          <Link href="/docs">Docs</Link>
          <Link href="/signin">Sign in</Link>
          <Link className={styles.navCta} href="/signup">Start your day →</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}><span /> The workday, finally in flow</p>
          <h1>A better workday doesn&apos;t start with paperwork.</h1>
          <p className={styles.lede}>
            Attendance, leave, payroll, and people operations—moving together in one calm rhythm.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/signup">Start your day <span>↗</span></Link>
            <a className={styles.textLink} href="#product">See how it flows ↓</a>
          </div>
        </div>

        <div className={styles.dayCard} data-reveal>
          <div className={styles.cardTop}>
            <div><span className={styles.liveDot} /> TODAY</div>
            <span>MON · 20 MAY</span>
          </div>
          <p className={styles.cardGreeting}>Good morning, Alex.</p>
          <p className={styles.cardSub}>Your workday is moving.</p>
          <div className={styles.eventList}>
            {events.map(([time, title, label], index) => (
              <div className={styles.event} key={time} style={{ "--delay": `${index * 130}ms` } as CSSProperties}>
                <time>{time}</time><span className={styles.eventNode} />
                <div><strong>{title}</strong><small>{label}</small></div>
                <b>✓</b>
              </div>
            ))}
          </div>
          <svg className={styles.flowArrow} viewBox="0 0 250 65" aria-hidden="true">
            <path d="M5 12 C80 55 155 55 234 17" />
            <path d="m224 10 12 7-8 11" />
          </svg>
          <p className={styles.aligned}>Everything aligned. <strong>Without the chase.</strong></p>
        </div>
      </section>

      <div className={styles.ticker} aria-hidden="true">
        <div>ATTENDANCE <i>●</i> LEAVE <i>●</i> PAYROLL <i>●</i> PEOPLE <i>●</i> ONE WORKDAY <i>●</i> ATTENDANCE <i>●</i> LEAVE <i>●</i> PAYROLL <i>●</i> PEOPLE <i>●</i> ONE WORKDAY <i>●</i></div>
      </div>

      <section className={styles.product} id="product">
        <div className={styles.sectionIntro} data-reveal>
          <p className={styles.kicker}>01 · ONE CONTINUOUS DAY</p>
          <h2>From first check-in<br />to final payslip.</h2>
          <p>Dayflow connects the moments that make work happen—so nobody has to stitch the day together by hand.</p>
        </div>
        <div className={styles.timeline} data-reveal>
          <div className={styles.timelineLine} />
          {[["01", "Show up", "Attendance that feels effortless.", "09:03"], ["02", "Take care", "Leave without the back-and-forth.", "11:40"], ["03", "Get it right", "Payroll built from the real day.", "16:15"], ["04", "Move forward", "A clear record for everyone.", "17:32"]].map(([n, title, copy, time]) => (
            <article className={styles.timelineItem} key={n}>
              <span className={styles.number}>{n}</span><span className={styles.timelineNode} />
              <time>{time}</time><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
        <div className={styles.productFrame} data-reveal>
          <Image src="/marketing/dayflow-product-video-hero.png" alt="Dayflow dashboard showing attendance, leave, payroll, and approval workflows" width={1672} height={941} priority />
          <div className={styles.frameCaption}><span>YOUR WHOLE WORKDAY</span><strong>One clear view.</strong></div>
        </div>
      </section>

      <section className={styles.perspectives} id="why-dayflow">
        <div className={styles.perspectiveCopy} data-reveal>
          <p className={styles.kicker}>02 · TWO SIDES, ONE SYSTEM</p>
          <h2>Clear for people.<br /><em>Calm for HR.</em></h2>
          <p>No mystery balances. No approval archaeology. Just the same, reliable truth for everyone.</p>
        </div>
        <div className={styles.perspectiveCards} data-reveal>
          <article><span>FOR EVERYONE</span><h3>“I know where I stand.”</h3><ul><li>Instant attendance history</li><li>Leave that explains itself</li><li>Payslips ready when you are</li></ul></article>
          <article><span>FOR PEOPLE TEAMS</span><h3>“The day runs itself.”</h3><ul><li>One source of truth</li><li>Approvals in the right hands</li><li>Payroll without reconstruction</li></ul></article>
        </div>
      </section>

      <section className={styles.manifesto} data-reveal>
        <FlowMark />
        <p>Work has enough friction.</p>
        <h2>Its systems<br />shouldn&apos;t add more.</h2>
        <Link className={styles.lightButton} href="/signup">Put your day in flow →</Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image
            className={styles.brandLogo}
            src="/brand/dayflow-logo.png"
            alt="Dayflow"
            width={140}
            height={44}
          />
          <p>Every workday,<br />perfectly aligned.</p>
        </div>
        <div className={styles.footerLinks}><span>PRODUCT</span><a href="#product">Overview</a><a href="#why-dayflow">Why Dayflow</a></div>
        <div className={styles.footerLinks}><span>RESOURCES</span><Link href="/docs">Documentation</Link><Link href="/docs#quick-start">Quick start</Link></div>
        <div className={styles.footerLinks}><span>ACCOUNT</span><Link href="/signin">Sign in</Link><Link href="/signup">Get started</Link></div>
        <small><span>© 2026 DAYFLOW</span><span>BUILT FOR BETTER WORKDAYS <i /></span></small>
      </footer>
    </main>
  );
}

function FlowMark() {
  return (
    <svg className={styles.logo} viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 5v34h9c13 0 21-6 21-17S29 5 16 5H7Z" />
      <path d="M7 22h30" />
      <circle cx="22" cy="22" r="3.2" />
    </svg>
  );
}
