import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import graphQLProxy, { ApiVersion } from "@shopify/koa-shopify-graphql-proxy";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import session from "koa-session";
import * as handlers from "./handlers/index";
dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES } = process.env;
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(
    session(
      {
        sameSite: "none",
        secure: true,
      },
      server
    )
  );
  server.keys = [SHOPIFY_API_SECRET];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET,
      scopes: [SCOPES],

      async afterAuth(ctx) {
        //Auth token and shop available in session
        //Redirect to shop upon auth
        const { shop, accessToken } = ctx.session;

        let header = {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        };

        console.log(accessToken, shop)

        //get shop ID
        const shop_info = await fetch(`https://${shop}/admin/api/2020-07/shop.json`,{
          method: 'GET',
          headers: header,
          body:JSON.stringify({
            shop: shop,
            token: accessToken
          })
        }).then(r=>r.json())


        //register the store into DB
        fetch(`${process.env.PROXY_SERVER}/api/v1/register`,{
          method: 'POST',
          headers:{
            "Content-Type": "application/json"
          },
          body:JSON.stringify({
            shop: shop,
            token: accessToken,
            shop_id: shop_info.shop.id
          })
        })

        fetch(`https://${shop}/admin/api/2020-07/webhooks.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            webhook: {
              topic: 'orders/paid',
              address: `${process.env.PROXY_SERVER}/api/v1/webhook/orderpayment`,
              format: 'json',
            }
          })
        })
        fetch(`https://${shop}/admin/api/2020-07/webhooks.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            webhook: {
              topic: 'carts/create',
              address: `${process.env.PROXY_SERVER}/api/v1/webhook/cart-creation`,
              format: 'json',
            }
          })
        })
        fetch(`https://${shop}/admin/api/2020-07/webhooks.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            webhook: {
              topic: 'carts/update',
              address: `${process.env.PROXY_SERVER}/api/v1/webhook/cart-update`,
              format: 'json',
            }
          })
        })
        fetch(`https://${shop}/admin/api/2020-07/webhooks.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            webhook: {
              topic: 'themes/publish',
              address: `${process.env.PROXY_SERVER}/api/v1/webhook/theme-publish`,
              format: 'json',
            }
          })
        })
        fetch(`https://${shop}/admin/api/2020-07/webhooks.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            webhook: {
              topic: 'customers/create',
              address: `${process.env.PROXY_SERVER}/api/v1/webhook/customer-create`,
              format: 'json',
            }
          })
        })

        fetch(`https://${shop}/admin/api/2020-07/script_tags.json`,{
          headers: header,
          method: "POST",
          body: JSON.stringify({
            script_tag: {
              event: 'onload',
              src: `${process.env.PROXY_SERVER}/api/v1/script`,
            }
          })
        })

        let { themes } = await fetch(
          `https://${shop}/admin/api/2020-07/themes.json`,
          {
            headers: header,
            method: "GET",
          }
        ).then((r) => r.json());

        console.log("themes: ", themes);
        const currentTheme = themes.filter((theme) => theme.role === "main");
        let themeAsset = await fetch(
          `https://${shop}/admin/api/2020-07/themes/${currentTheme[0].id}/assets.json?asset[key]=layout/theme.liquid`,
          {
            headers: header,
            method: "GET",
          }
        ).then((r) => r.json());

        let themeMatch = /<head>\n/.exec(themeAsset.asset.value);
        let themeModifiedHTML =
          themeAsset.asset.value.slice(0, themeMatch.index + 7) +
          "<script>\nvar customerid = {{ customer.id }}\nvar customerphone = {{ customer.phone }}\n</script>\n" +
          themeAsset.asset.value.slice(themeMatch.index + 7);
        fetch(
          `https://${shop}/admin/api/2020-07/themes/${currentTheme[0].id}/assets.json`,
          {
            headers: header,
            method: "PUT",
            body: JSON.stringify({
              asset: {
                key: "layout/theme.liquid",
                value: themeModifiedHTML,
              },
            }),
          }
        );

        let productAsset = await fetch(
          `https://${shop}/admin/api/2020-07/themes/${currentTheme[0].id}/assets.json?asset[key]=templates/product.liquid`,
          {
            headers: header,
            method: "GET",
          }
        ).then((r) => r.json());

        let productModifiedHTML =
          "<script>var productid = {{ product.id }}</script>\n" +
          productAsset.asset.value;
        fetch(
          `https://${shop}/admin/api/2020-07/themes/${currentTheme[0].id}/assets.json`,
          {
            headers: header,
            method: "PUT",
            body: JSON.stringify({
              asset: {
                key: "templates/product.liquid",
                value: productModifiedHTML,
              },
            }),
          }
        );

        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.cookies.set("accessToken", accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.redirect("/");
      },
    })
  );
  server.use(
    graphQLProxy({
      version: ApiVersion.October19,
    })
  );
  router.get("*", verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
