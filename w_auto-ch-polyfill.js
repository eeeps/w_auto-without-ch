( () => {

// if client hints are supported, don’t do anything
if ( document.featurePolicy &&
     document.featurePolicy.allowsFeature( 'ch-width' ) ) {
	return;
}

const wAutoRegExp = /(.+)w_auto\:(\d+)\:(\d+)(.+)/;
const urlHasWAuto = ( urlString ) => wAutoRegExp.test( urlString );
const rewriteWAuto = ( urlString, pxSizeNumber ) => {
	const matched = urlString.match( wAutoRegExp );
	if ( matched === null ) {
		// fail silently. error instead?
		return urlString;
	}
	return `${ matched[1] }w_auto:${ matched[2] }:${ Math.round( pxSizeNumber ).toString() }${ matched[4] }`;
}
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
			
			// if it's (still) eligible for a re-write
			if ( eligibleForRewrite( entry.target ) ) {
				entry.target.src = rewriteWAuto(
					entry.target.src,
					entry.contentRect.width * window.devicePixelRatio
				);
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