import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  GitBranch,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  Check,
} from "lucide-react"
import { PLANS, PLAN_FEATURES, type PlanKey } from "@/lib/constants"

const features = [
  {
    icon: GitBranch,
    color: "text-blue-600",
    title: "Git Integration",
    description:
      "Connect your GitHub repos with one click. We analyze issues, PRs, and code comments to find technical debt.",
  },
  {
    icon: DollarSign,
    color: "text-green-600",
    title: "Cost Estimation",
    description:
      "Translate debt items into dollar amounts using configurable hourly rates and priority-based estimates.",
  },
  {
    icon: BarChart3,
    color: "text-purple-600",
    title: "Trend Dashboard",
    description:
      "Visualize debt over time, spot trends, and track progress as your team pays down debt sprint by sprint.",
  },
  {
    icon: Users,
    color: "text-orange-600",
    title: "Team Collaboration",
    description:
      "Invite your team, assign owners to debt items, and coordinate paydown efforts across the organization.",
  },
  {
    icon: AlertTriangle,
    color: "text-red-600",
    title: "Priority Breakdown",
    description:
      "Categorize debt by severity, see which items cost the most, and focus your team on what matters.",
  },
  {
    icon: RefreshCw,
    color: "text-cyan-600",
    title: "Automated Sync",
    description:
      "Keep your debt inventory up to date with automatic syncing from GitHub on a schedule you control.",
  },
]

const steps = [
  {
    number: 1,
    title: "Connect",
    description:
      "Link your GitHub account and select the repositories you want to track.",
  },
  {
    number: 2,
    title: "Analyze",
    description:
      "We scan issues, PRs, and code comments to identify and categorize technical debt.",
  },
  {
    number: 3,
    title: "Act",
    description:
      "Use cost estimates and priority insights to make data-driven decisions about what to fix first.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              DebtLens
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#pricing"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Beta
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Know the true cost of
            <br />
            <span className="text-blue-600">technical debt</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Connect your GitHub repos and get instant visibility into your
            technical debt. Track costs, prioritize fixes, and make data-driven
            engineering decisions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Free plan available. No credit card required.
          </p>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <feature.icon className={`mb-4 h-10 w-10 ${feature.color}`} />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="border-t border-zinc-200 bg-white py-24 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
              Get from zero to actionable insights in minutes.
            </p>
            <div className="mt-16 grid gap-12 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
              Start free and scale as your team grows.
            </p>
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {(
                Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]
              ).map(([key, plan]) => (
                <div
                  key={key}
                  className={`rounded-xl border p-6 ${
                    key === "pro"
                      ? "border-blue-600 ring-2 ring-blue-600"
                      : "border-zinc-200 dark:border-zinc-800"
                  } bg-white dark:bg-zinc-900`}
                >
                  {key === "pro" && (
                    <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {plan.name}
                  </h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-zinc-500">/mo</span>
                    )}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {PLAN_FEATURES[key].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link
                      href="/register"
                      className={`block w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${
                        key === "pro"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      }`}
                    >
                      {key === "free" ? "Get Started" : "Start Free Trial"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-zinc-900 dark:text-zinc-50">
                  DebtLens
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-500">
                Track, estimate, and reduce your technical debt cost.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Product
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Company
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="text-sm text-zinc-400">About</span>
                </li>
                <li>
                  <span className="text-sm text-zinc-400">Blog</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Legal
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="text-sm text-zinc-400">Privacy</span>
                </li>
                <li>
                  <span className="text-sm text-zinc-400">Terms</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
            &copy; {new Date().getFullYear()} DebtLens. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
