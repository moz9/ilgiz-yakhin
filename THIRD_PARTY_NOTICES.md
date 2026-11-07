# Third-Party Notices

## Expandable Card

`src/components/project-archive.tsx` adapts the disclosure behavior of **Expandable
Card** by Elia Kuratli, discovered in the 21st community library:

- Listing: https://21st.dev/@kuratlielia/components/expandable-card
- Public source: https://github.com/kuratlielia/arc-library/blob/8302b52ed9dc79ae7ca699b158a98dfdf09656f7/public/r/expandable-card.json
- License: https://github.com/kuratlielia/arc-library/blob/8302b52ed9dc79ae7ca699b158a98dfdf09656f7/LICENSE

The adaptation retains the accessible disclosure trigger, `useId` panel linkage,
spring height animation, mounted/inert closed panel, opacity transition, and Escape
focus restoration. It replaces the styling and project content, lifts expansion
state into the project list, adds independent case links, and omits width
measurement, motion tokens and rolling text. No upstream demo images are used.

The footer is an original implementation. https://www.footer.design/ was consulted
as a visual reference for large typography and a contact-led composition; no code,
images, logos, or other assets were copied from its showcased websites.

### MIT License

Copyright (c) 2026 Elia Kuratli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
