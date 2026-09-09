# MSRG website

[Live website](https://msrg.github.io/) · [Repository](https://github.com/MSRG/msrg.github.io)

Members propose changes through **pull requests (PRs)**. A maintainer reviews
and merges them into `main`, which automatically publishes the website.

## Setup

Install [Pixi](https://pixi.sh/latest/installation/) and Git. Pixi installs the
pinned Hugo extended and Python versions automatically on Windows, macOS
(Intel/Apple Silicon), and Linux (x86-64/ARM64). If you do not have write access,
fork the repository on GitHub and use your fork's clone URL below.

```sh
git clone https://github.com/MSRG/msrg.github.io.git
cd msrg.github.io
git switch -c update-my-profile
pixi run editor
```

Open **http://127.0.0.1:1314** to edit. The tool starts the local website too;
use its preview link to view your changes. **Ctrl+C** stops both servers.

| Command | Purpose |
| --- | --- |
| `pixi run serve` | Preview the website. |
| `pixi run editor` | Open the website editor and start its local preview. |
| `pixi run check` | Run tests, build, and check links. |
| `pixi run build` | Build the website into `public/`. |

The environment stays in `.pixi/`; commit `pixi.toml` and `pixi.lock`, not `.pixi/`.

Tests, builds, and link checks use [Pixi's task cache](https://pixi.prefix.dev/latest/workspace/advanced_tasks/#caching)
to skip unchanged work. Source or dependency changes invalidate it; missing or
modified `public/` files trigger a rebuild. Builds also refresh across day
changes for automatic alumni transitions. To force a fresh check, run
`pixi run clean-cache`, then `pixi run check`. Preview and editor always start.

## Edit your member profile

Run the editor from your local website folder:

```sh
pixi run editor
```

Open **http://127.0.0.1:1314**. Choose **Member profiles**, select your name or
**Create an entry**, fill in the form, then **Save changes**. Use **Upload a
portrait** to add your photo; crop alignment, roles, dates, research areas,
specialities, links, and awards are all in the form. No source-file editing or
manual photo copying is needed.

Use only a `utoronto.ca` email address (including subdomains such as
`mail.utoronto.ca`), or leave it empty. Personal email addresses are not published.

You can change **Member identifier** in the form. Saving asks for confirmation,
renames the member file and matching personal-site folder, and updates local
references. Old shared URLs change; preview custom sites carefully, since
framework builds may need regenerating for the new address. Changing only your
display name does not require a new identifier.

Leave unknown details empty. A confirmed end date moves you to alumni on the
first build after that day, month, or year ends (Toronto time).
Alumni lists show only the end year. Dates saved in profiles are still visible
in the public repository; leave start dates empty if you prefer not to share them.

The editor starts Hugo automatically. **Preview on local website** becomes
available when the preview is ready; Ctrl+C stops both. If port 1313 is already
in use, the editor uses another available port and updates its preview link.
The profile form also shows whether an on-site personal page is enabled.

Saving stays local; [submit a pull request](#check-and-submit-your-pull-request)
to request publication.

## More edits through the same tool

Choose what to edit using the selector at the top of the editor:

| Choose | What you can do |
| --- | --- |
| Personal Pages | Select your name and a template; write your page, add links, highlights, and timeline entries, and upload images or attachments. |
| Publications | Create or update paper details, abstracts, authors, research areas, tags, related datasets, and additional notes. |
| Datasets and downloads | Create or update descriptions, sources, related papers, and download links; upload files directly. |

Uploads support files up to **20 MB**. Link to an external repository for larger
datasets. Each upload gets a unique filename, preserving existing files.

For publications, paste the paper's abstract into **Abstract**. Use **Bold** or
**Italic** for emphasis, **Inline formula** for math such as `\(x^2\)`, and
**Equation** for a separate formula. Pasted `$...$`, `$$...$$`, and `\[...\]`
also work. Save, then open **Preview on local website** to check the result.
Use **Code** for literal dollar amounts. Math uses Hugo's built-in renderer;
full LaTeX documents and custom packages are not supported. Existing overview
text is kept under **Additional notes**, separate from the abstract.

### Personal Pages

Save your member profile first, then choose **Personal Pages** and your
name. Select **single** for a simple reading page, **academic** for a profile
sidebar, or **structured** for focus areas, links, highlights, and a timeline.
Write in **Page text**; formatting buttons and uploads help you add content.
Use **Save and preview** to see the page inside the editor, at full width or
phone width. The preview shows saved changes. Templates keep styling simple;
custom CSS controls and stylesheet uploads are not available in the editor.

For full control over HTML, CSS, JavaScript, or a framework, choose the
[custom website approach](#build-your-own-site) instead. The editor explains
this option and can preview an existing custom site.

Your page appears at **`/~your-member-identifier/`**, and your card automatically
gets a **Personal website** icon. For a site hosted elsewhere, fill in **Personal
website** in your member profile instead.

### Create a shared template

Anyone can propose a new hand-written template in `layouts/personal/`, with shared
styles or scripts in `assets/`. Add its layout name to the personal template
choices in `data/content_schema.json`; it then appears in the editor for everyone
to select. Submit the design through a pull request.

### Build your own site

Use your member identifier in place of `jane-doe`. Upload your complete website
to **`static/~jane-doe/`**, starting with `index.html`.
Use ordinary HTML/CSS/JS: **no TOML, Hugo front matter, or imposed page layout**.
Reference assets relatively (`./style.css`) or under `/~jane-doe/`.

For React, Vue, Svelte, or another framework, export a **static build**, set its
base URL to `/~jane-doe/`, and put the build output in that folder. The workflow
does not build individual framework projects, and GitHub Pages cannot run a
backend. Use hash routing or export an HTML file for each route.

Choose your name in **Personal Pages** to preview the custom site, then submit
the files through a PR.
When switching between a template and a custom site, remove the previous version
so both don't write to the same URL.

## Other website content

| What | Where |
| --- | --- |
| Homepage text | `content/_index.md` |
| Research themes | `content/research/` |

These less frequent changes can be proposed using GitHub's file editor on a
branch or fork, followed by a pull request.

Edit source files, not generated `public/` pages. Everything in `content/` and
`static/` may be published; keep private notes outside them.

## Check and submit your pull request

Preview affected pages on desktop and phone widths. For local changes, run:

```sh
pixi run check
```

For local edits, commit your intended source files and photos, push your branch,
and open a PR against **`MSRG/msrg.github.io:main`**. Describe the change, include sources for
factual updates, and add screenshots for visual changes. Don't commit `public/`.

The **Validate website** check must pass before review and merging. PRs test
without deploying; merged changes publish automatically. Check the live site
after deployment. If you edited only on GitHub, CI runs the checks for you.

### Browser checks

<details>
<summary>Optional automated layout and accessibility checks</summary>

With Node installed, build the site (`pixi run build`), then run:

```sh
npm install --prefix /tmp/msrg-browser playwright@1.63.0 axe-core@4.13.0
node /tmp/msrg-browser/node_modules/playwright/cli.js install chromium firefox
NODE_PATH=/tmp/msrg-browser/node_modules node scripts/browser_check.cjs public
NODE_PATH=/tmp/msrg-browser/node_modules node scripts/editor_check.cjs
BROWSER_ENGINE=firefox NODE_PATH=/tmp/msrg-browser/node_modules node scripts/browser_check.cjs public
```

Playwright reports missing system dependencies. Reports and screenshots go to
an output directory printed at completion. These optional checks block external
services; check external links, the news widget, and physical phones separately.

</details>

## For maintainers

- **Dependencies:** update `pixi.toml`, run `pixi install`, and commit the updated
  `pixi.lock`. CI uses that same locked environment; PR checks cover Linux,
  macOS, and Windows.
- **Handover:** keep repository administration with MSRG and ensure another
  maintainer can review PRs and manage deployment. Members use GitHub and
  the local Pixi editor; there is no hosted editing service or login server to maintain.
- **Content definitions:** [data/content_schema.json](data/content_schema.json)
  supplies the forms, archetypes, validation, and roster role groups. Change fields
  and choices there; research-area choices come from `content/research/`.
- **Deployment:** Pages must use **GitHub Actions**. Configure `main` protection
  to require PRs and the **Validate website** check; workflow files alone do not
  enforce this. See [GitHub's branch protection guide](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).
- **Local notes:** `docs/`, `local-notes/`, `hugo.txt`, and `New_Images/` are ignored
  by Git. Final portraits belong in `static/images/people/`.
