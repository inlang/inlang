import React from "react";
import cn from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";

import renderComponent from "./utils/render-component";
import { getFSRoute } from "./utils/get-fs-route";
import useMenuContext from "./utils/menu-context";

import { useConfig } from "./config";
import Search from "./search";
import Flexsearch from "./flexsearch";
import GitHubIcon from "./icons/github";
import DiscordIcon from "./icons/discord";
import { Item, PageItem } from "./utils/normalize-pages";

interface NavBarProps {
  isRTL?: boolean | null;
  flatDirectories: Item[];
  flatPageDirectories: PageItem[];
}

export default function Navbar({
  flatDirectories,
  flatPageDirectories,
}: NavBarProps) {
  const config = useConfig();
  const { locale, asPath } = useRouter();
  const activeRoute = getFSRoute(asPath, locale);
  const { menu, setMenu } = useMenuContext();

  return (
    <div className="nextra-nav-container z-20 sticky top-0 before:bg-white before:bg-opacity-[.85] before:backdrop-blur-md before:absolute before:block before:w-full before:h-full before:z-[-1] dark:before:bg-dark dark:before:bg-opacity-80 dark:before:border-b dark:before:border-white dark:before:border-opacity-10">
      <nav className="flex max-w-[90rem] mx-auto items-center left-0 right-0 h-16 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
        {/* MODIFICATION: align nav links to the left */}
        <div className="flex items-center pr-6">
          <Link href="/">
            <a className="no-underline text-current inline-flex items-center hover:opacity-75">
              {renderComponent(config.logo, { locale })}
            </a>
          </Link>
        </div>

        {flatPageDirectories
          ? flatPageDirectories.map((page) => {
              if (page.hidden) return null;

              let href = page.route;

              // If it's a directory
              if (page.children) {
                href = page.firstChildRoute ?? href;
              }

              const isActive =
                page.route === activeRoute ||
                activeRoute.startsWith(page.route + "/");

              return (
                <Link href={href} key={page.route}>
                  {/* MODICATION: links not grey */}
                  <a
                    className={cn(
                      "no-underline whitespace-nowrap mr-4 hidden md:inline-block text-current",
                      isActive ? "font-semibold" : ""
                    )}
                    aria-selected={isActive}
                  >
                    {page.title}
                  </a>
                </Link>
              );
            })
          : null}
        <Link href={"https://github.com/inlang/inlang/discussions"}>
          {/* MODICATION: links not grey */}
          <a
            target="_blank"
            className={cn(
              "no-underline whitespace-nowrap mr-4 hidden md:inline-block text-current"
            )}
          >
            Discussions
          </a>
        </Link>
        {config.projectLink || config.github ? (
          <a
            className="text-current p-2"
            href={config.projectLink || config.github}
            target="_blank"
            rel="noreferrer"
          >
            {config.projectLinkIcon ? (
              renderComponent(config.projectLinkIcon, { locale })
            ) : (
              <React.Fragment>
                <GitHubIcon height={24} />
                <span className="sr-only">GitHub</span>
              </React.Fragment>
            )}
          </a>
        ) : null}
        {config.projectChatLink ? (
          <a
            className="text-current p-2"
            href={config.projectChatLink}
            target="_blank"
            rel="noreferrer"
          >
            {config.projectChatLinkIcon ? (
              renderComponent(config.projectChatLinkIcon, { locale })
            ) : (
              <React.Fragment>
                <DiscordIcon height={24} />
                <span className="sr-only">Discord</span>
              </React.Fragment>
            )}
          </a>
        ) : null}

        {/* MODIFICATION: align search to the right, independent of nav links */}
        <div className="flex-1 flex w-full justify-end">
          <div className="hidden md:inline-block pr-4">
            {config.customSearch ||
              (config.search ? (
                config.unstable_flexsearch ? (
                  <Flexsearch />
                ) : (
                  <Search directories={flatDirectories} />
                )
              ) : null)}
          </div>
        </div>
        {/* MODIFICATION: Sign in button */}
        <Link href="https://app.inlang.dev">
          <a
            className={
              "no-underline whitespace-nowrap mr-4 hidden md:inline-block text-current"
            }
          >
            Sign in
          </a>
        </Link>
        {/* MODIFICATION: Sign up button */}
        <Link href="https://app.inlang.dev">
          <a
            className={
              "border-2 border-current rounded-lg py-1 px-2 mr-3 no-underline whitespace-nowrap hidden md:inline-block text-current"
            }
          >
            Sign up
          </a>
        </Link>

        <button className="block md:hidden p-2" onClick={() => setMenu(!menu)}>
          <svg
            fill="none"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="-mr-2" />
      </nav>
    </div>
  );
}
