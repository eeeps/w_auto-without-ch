# w_auto without Client Hints

Use [`w_auto`](https://cloudinary.com/documentation/transformation_reference#w_auto) in browsers that don’t support [Responsive Image Client Hints](https://wicg.github.io/responsive-image-client-hints/) by sending [Cloudinary](https://cloudinary.com) target widths in the URL, instead.

## Installation

Self-host the minified file somewhere and load it:

1. in the `<head>` of your page,
2. as a blocking script. No `async`, `defer`, or `type="module"` allowed!

This script needs to see `<img>`s as soon as they are parsed, so that it can prepare to re-write their URLs as soon as they’re laid out. If the script executes after an `<img>` has been parsed, it won’t get a chance to do any of that; it’ll do nothing.

Luckily, it’s only ~700 bytes (500B compressed).

## Usage

Once you’ve got the blocking script in the `<head>`, your `<img>`s need to:

- have a `loading="lazy"` attribute;
- have a `src` that includes Cloudinary’s [`w_auto` transformation](https://cloudinary.com/documentation/transformation_reference#w_auto), with all three parameters set (we re-write the last one, `<fallback width>`, to send Cloudinary the layout width).

That’ll look something like this:

```html
<img
	src="https://o.img.rodeo/image/upload/c_limit,w_auto:300:900,f_auto,q_auto/dogs/7"
	loading="lazy"
	sizes="auto"
	width="9000"
	height="6000"
	alt="A black-and-white dog, facing the camera, eagerly bearing down on a tennis ball."
>
```

### Notes!

- If the [browser supports the Responsive Image Client Hints](https://caniuse.com/client-hints-dpr-width-viewport), we assume `Sec-CH-Width` hints will be sent; the script does nothing.
- In case JavaScript is disabled, or the script fails for any other reason, set the `<fallback-width>` to something sensible in your HTML.
- Because we steadfastly refuse to double-load images, or artificially delay an image load, this script will only rewrite the `src` attributes of lazy-loaded `<img>`s, before their loads start. [`<img>`s that could possibly be responsible for the Largest Contentful Paint should never be lazy-loaded](https://web.dev/articles/lcp-lazy-loading); for LCP images, your options are:
	1. Accept a lack of responsive sizing in browsers that don’t support Responsive Image Client Hints (loading a too-big image ASAP will usually be faster than loading a right-sized image, late).
	2. Abandon Client Hints altogether, accept a bunch of complexity, and write a `srcset` and (non-`auto`) `sizes`.
