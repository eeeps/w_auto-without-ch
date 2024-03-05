( () => {

// if client hints are supported, don’t do anything
if ( document.featurePolicy &&
     document.featurePolicy.allowsFeature( 'ch-width' ) ) {
	return;
}

// intentionally not global, we don't support srcsets with lists
const wAutoRegExp = /w_auto\:(\d+)\:(\d+)/;
const urlHasWAuto = ( urlString ) => wAutoRegExp.test( urlString );
const rewriteWAuto = ( urlString, pxSizeNumber ) =>
	urlString.replace( wAutoRegExp, 
		( match, roundingStep ) =>
			`w_auto:${ roundingStep }:${ Math.round( pxSizeNumber ) }`
	)
;

const eligibleForRewrite = ( imgEl ) => ( 
	!( imgEl.complete ) && // This doesn't catch in-progress loads
	                       // But I think it's the best we can do?
	imgEl.getAttribute( 'loading' ) === 'lazy' && 
	imgEl.hasAttribute( 'src' ) &&
	urlHasWAuto( imgEl.src )
);

const ro = new ResizeObserver( ( entries ) => {
	entries.forEach( ( entry ) => {
		
		// if the <img> has been laid out
		if ( entry.contentRect.width > 0 || entry.contentRect.height > 0 ) { 
			
			const width = entry.contentRect.width * window.devicePixelRatio;
			
			// if it's (still) eligible for a re-write
			if ( eligibleForRewrite( entry.target ) ) {
				
				// if it's in a <picture>, rewrite the first matching source element’s srcset
				let matchedSource = false;
				if ( entry.target.parentNode.tagName === "PICTURE" ) {
					const sourceElements = entry.target.parentNode.querySelectorAll( 'source[media]' );
					for ( const sourceEl of sourceElements ) {
						if ( window.matchMedia( sourceEl.getAttribute( 'media' ) ).matches ) {
							const srcset = sourceEl.getAttribute( 'srcset' );
							sourceEl.setAttribute( 'srcset', rewriteWAuto(
								srcset,
								width
							) );
							matchedSource = true;
							break;
						}
					}
				}
				
				// if it's not, or if there were not matching source elements, rewrite the img src
				if ( !matchedSource ) {
					entry.target.src = rewriteWAuto(
						entry.target.src,
						width
					);
				}
			
			}
			
			// unobserve after it has been laid out no matter what
			ro.unobserve( entry.target );
			
		}
		
	} );
} );

const mo = new MutationObserver( ( mutations ) => {
	for ( const mutation of mutations ) {
		for ( const newNode of mutation.addedNodes ) {
			if ( newNode.nodeType === 1 && // elements only, no text!
			     newNode.nodeName === "IMG" && // just IMG elements
			     eligibleForRewrite( newNode ) ) {
				ro.observe( newNode );
			}
		}
	}
} );

// start MutationObserving the document
mo.observe( document, { childList: true, subtree: true } );

} )();