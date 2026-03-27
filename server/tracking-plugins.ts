const GTM_CONTAINER_ID = "GTM-WMR7H6";

export function clayTrackingPlugin() {
  return {
    name: 'clay-tracking',
    injectHtmlTags() {
      return {
        postBodyTags: [
          '<script src="https://static.claydar.com/init.v1.js?id=cQAbHkxXzz" defer></script>',
        ],
      };
    },
  };
}

export function googleTagGatewayPlugin() {
  return {
    name: 'google-tag-gateway',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://goteleport.com/m/'+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`,
          },
        ],
        postBodyTags: [
          `<noscript><iframe src="https://goteleport.com/m/" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
        ],
      };
    },
  };
}
