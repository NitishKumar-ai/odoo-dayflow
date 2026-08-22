import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Documentation — Dayflow",
  description: "Guides and technical references for getting the most from Dayflow.",
};

const guides = [
  {
    number: "01",
    label: "Start here",
    title: "Set up your workspace",
    copy: "Install Dayflow, connect PostgreSQL, prepare the environment, and launch your first workday.",
    href: "#quick-start",
  },
  {
    number: "02",
    label: "For employees",
    title: "Move through the day",
    copy: "Learn how attendance, leave balances, requests, payroll, and profile records work together.",
    href: "#employee-workflows",
  },
  {
    number: "03",
    label: "For people teams",
    title: "Run people operations",
    copy: "Review approvals, manage employee records, correct attendance, and maintain salary history.",
    href: "#people-operations",
  },
];

const references = [
  ["Authentication", "Email verification, sessions, roles, and protected actions."],
  ["Attendance", "Check-in rules, weekly records, overrides, and status calculation."],
  ["Leave", "Balances, business-day calculations, approvals, and cancellation."],
  ["Payroll", "Salary components, effective dates, revision history, and visibility."],
];

export default function DocsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Dayflow home">
          <Image src="/brand/dayflow-logo.png" alt="Dayflow" width={140} height={44} priority />
        </Link>
        <nav aria-label="Documentation navigation">
          <a href="#guides">Guides</a>
          <a href="#reference">Reference</a>
          <Link href="/signin">Sign in</Link>
          <Link className={styles.headerCta} href="/signup">Get started →</Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> Dayflow documentation</p>
            <h1>Everything you need to keep work <em>in flow.</em></h1>
            <p className={styles.lede}>
              Practical guides for employees and people teams, plus the technical detail developers need to run Dayflow with confidence.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#quick-start">Start with the basics ↘</a>
              <a className={styles.secondaryLink} href="#reference">Browse reference</a>
            </div>
          </div>

          <aside className={styles.startCard} aria-label="Documentation quick start">
            <div className={styles.cardHeader}><span>QUICK START</span><b>~ 5 MIN</b></div>
            <p className={styles.stepLabel}>Your first local workday</p>
            <ol>
              <li><span>1</span><div><strong>Install the project</strong><code>npm install</code></div></li>
              <li><span>2</span><div><strong>Prepare the database</strong><code>npm run db:push</code></div></li>
              <li><span>3</span><div><strong>Start Dayflow</strong><code>npm run dev</code></div></li>
            </ol>
            <p className={styles.cardNote}><i /> Built with Next.js 16, PostgreSQL, and Drizzle ORM.</p>
          </aside>
        </section>

        <section className={styles.guides} id="guides">
          <div className={styles.sectionHeading}>
            <p className={styles.kicker}>CHOOSE YOUR PATH</p>
            <h2>Clear answers,<br />right when you need them.</h2>
            <p>Start with a complete journey or jump directly to the part of the workday you&apos;re handling.</p>
          </div>
          <div className={styles.guideGrid}>
            {guides.map((guide) => (
              <a className={styles.guideCard} href={guide.href} key={guide.number}>
                <div><span>{guide.number}</span><small>{guide.label}</small></div>
                <h3>{guide.title}</h3>
                <p>{guide.copy}</p>
                <b>Read the guide <span>↗</span></b>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.workflow} id="quick-start">
          <div className={styles.workflowIntro}>
            <p className={styles.kicker}>QUICK START</p>
            <h2>From clone to check-in.</h2>
            <p>A short, dependable path to a working local environment.</p>
          </div>
          <div className={styles.steps}>
            <article><span>01</span><div><h3>Configure</h3><p>Add your database URL, session secret, app URL, and a local demo password to <code>.env.local</code>.</p></div></article>
            <article><span>02</span><div><h3>Seed</h3><p>Push the schema and seed realistic employees, attendance history, leave requests, and salary records.</p></div></article>
            <article><span>03</span><div><h3>Explore</h3><p>Sign in as an employee or administrator and follow a complete workday through the product.</p></div></article>
          </div>
        </section>

        <section className={styles.reference} id="reference">
          <div className={styles.referenceHeading}>
            <p className={styles.kicker}>PRODUCT REFERENCE</p>
            <h2>The system,<br />without the mystery.</h2>
          </div>
          <div className={styles.referenceList}>
            {references.map(([title, copy], index) => (
              <article id={index === 1 ? "employee-workflows" : index === 3 ? "people-operations" : undefined} key={title}>
                <span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p><b aria-hidden="true">↗</b>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.help}>
          <div><p className={styles.kicker}>NEED A HAND?</p><h2>Make the next step obvious.</h2></div>
          <p>Start with a demo account, explore the complete workflow, and see how Dayflow keeps every record aligned.</p>
          <Link className={styles.helpButton} href="/signup">Create an account →</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link href="/" aria-label="Dayflow home"><Image src="/brand/dayflow-logo.png" alt="Dayflow" width={150} height={47} /></Link>
            <p>Every workday,<br />perfectly aligned.</p>
          </div>
          <div className={styles.footerColumn}><span>PRODUCT</span><Link href="/#product">Overview</Link><Link href="/#why-dayflow">Why Dayflow</Link><Link href="/signup">Get started</Link></div>
          <div className={styles.footerColumn}><span>RESOURCES</span><Link href="/docs">Documentation</Link><a href="#quick-start">Quick start</a><a href="#reference">Reference</a></div>
          <div className={styles.footerColumn}><span>ACCOUNT</span><Link href="/signin">Sign in</Link><Link href="/signup">Create account</Link></div>
        </div>
        <div className={styles.footerBottom}><span>© 2026 DAYFLOW</span><span>BUILT FOR BETTER WORKDAYS <i /></span></div>
      </footer>
    </div>
  );
}
