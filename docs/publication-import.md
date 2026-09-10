# Publication backfill — 2026-09-10

Added 336 publication records and reviewed the 36 existing records. The initial archive
contained 372 entries from 2002–2026, including the existing dataset entry.
A subsequent review removed 29 abstract-only/short poster and demo records,
leaving 343 entries (342 papers and one dataset).
The scope is papers coauthored by Hans-Arno Jacobsen and at least one person in
the current or alumni roster. Existing entries outside that scope were retained.

## Sources and version selection

- Queried all 486 records in [Jacobsen's DBLP bibliography](https://dblp.org/pid/j/HansArnoJacobsen)
  through the [DBLP knowledge graph](https://sparql.dblp.org/). Of these, 390
  paper records matched another member; three matching dataset/software records
  were excluded from the paper backfill.
- Compared 567 [OpenAlex records](https://openalex.org/authors/A5072791865)
  to find gaps, then checked additions against publisher, conference, arXiv,
  or institutional records. Each paper uses `external_url` as its single paper
  link. Import sources are recorded separately in
  [publication provenance](publication-provenance.json).
- Preserved ordered author lists and existing page paths, notes, and dataset
  associations. Added verified author-name variants to nine member profiles.
- Matched 55 arXiv identifiers to published conference, workshop, journal, or
  book versions. These share one entry with the published version. Distinct
  conference and journal papers remain separate, even when their titles match.
- Seven existing arXiv links now point to published versions. The archive retains
  31 preprints for which a corresponding published version was not confirmed.
  A related poster or a similar title alone is insufficient to merge papers.

## Metadata decisions

- The [IJCAI survey's proceedings page](https://www.ijcai.org/proceedings/2024/919)
  and PDF agree on the title and authors. Crossref returned unrelated metadata
  for its DOI, so the entry links directly to IJCAI.
- The [graph partitioning comparison](https://doi.org/10.48786/edbt.2025.14)
  belongs to EDBT 2025; DBLP's 2024 year was corrected using DataCite and the
  official proceedings. Journal issue years take precedence over early online
  dates when an issue year is available.
- The PADRES book chapter appeared twice across the indexes, with different
  years and author-name variants. It is represented once using the 2010 DBLP
  record and the publisher DOI.
- Alexander Erben/Isenko share DBLP author identifier `314/5970`.
  Michalis Bachras publishes as Michail Bachras; Alex Cheung appears as
  Alex King Yeung Cheung; Mohammadreza Najafi also appears as Mohammedreza Najafi.
  Accents, capitalization, and punctuation variants are retained for matching.

## Coverage limits

This is a public-source backfill, not a guarantee that every historical paper
has been indexed. Unmatched member names do not establish that a member has no
publications. No abstracts, summaries, or missing biographical details were generated.

Edited proceedings, software/data deposits, and presentations without a paper
were not imported as papers. Institutional records identify “The World Cup of
Event Processing” as a summer-school presentation and “SDN-like: a
network-as-a-service publish/subscribe model” as a workshop presentation.
The need- and willingness-based EV charging item is a presentation. The distinct
SDN-like arXiv paper is included.

“Efficient Filtering of RSS Documents on Computer Cluster” remains unresolved:
the secondary index points to an unavailable CiteSeerX copy and does not establish
a venue. An authoritative group BibTeX export would help close this and any
unindexed gaps.


## Abstracts and archive pagination

- Added 304 original abstracts. Most come from
  [OpenAlex API metadata](https://help.openalex.org/api/), published under CC0;
  additional text comes from explicitly licensed publisher and repository copies.
  Those entries also retain the license link. Abstract sources are recorded in
  [publication provenance](publication-provenance.json), rather than in the
  publication editor or displayed below abstracts. Published abstracts are
  preferred over corresponding preprint abstracts.
- Removed generated summaries from publication metadata, page notes, and the
  publication editor. Imported plain text is escaped for Markdown/HTML safety;
  whitespace, extraction artifacts, and detached indexing headings are normalized.
- Replaced the RSC graphical-abstract caption with the actual published abstract.
  Rejected a PADRES record that ends mid-sentence. The remaining 38 papers need
  complete source text with suitable reuse terms; see
  [the pending list](publication-abstracts-pending.json). Authors can paste their
  original abstracts into the editor. Missing abstracts retain a source link.
- [Excluded records](publication-exclusions.json) include conference abstracts,
  extended abstracts, short poster/demo abstracts, a tutorial abstract, and a
  workshop announcement. Full papers remain, including longer workshop/demo
  papers and the full journal article corresponding to the ICDE presentation.
- The archive renders at most 100 cards per page, including without JavaScript.
  Search loads a separate index on first use, caches it in memory, and renders only
  the current 100 matching records. Typing is debounced by 150 ms. The index covers
  titles, author aliases, venues, years, and abstracts across every page.
- Paper and license links open in a new tab with `noopener noreferrer`.
