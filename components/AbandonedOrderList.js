import React from "react";
import Cookies from "js-cookie";
import {
  Card,
  Tabs,
} from "@shopify/polaris";

import ResourceListBody from "./ResourceListBody";

export default function AbandonedOrderList({ cart, checkouts }) {
  const accessToken = Cookies.get("accessToken");
  const shop = Cookies.get("shopOrigin");

  const [abandonedCheckout, setAbandonedCheckout] = React.useState([]);
  const [abandonedCart, setAbandonedCart] = React.useState([]);

  const [selected, setSelected] = React.useState(0);

  const handleTabChange = React.useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    []
  );

  React.useEffect(() => {
    let header = {
      "Content-Type": "application/json",
    };
    if (accessToken && shop) {
      fetch(`https://a1e60cec67c8.ngrok.io/api/v1/proxy`, {
        headers: header,
        method: "POST",
        body: JSON.stringify({
          accessToken: accessToken,
          shop: shop,
        }),
      })
        .then((r) => r.json())
        .then((r) => {
          setAbandonedCheckout(r.checkouts);
        });
    }

    if (shop) {
      fetch(
        `https://a1e60cec67c8.ngrok.io/api/v1/cart?shop=${shop}&ecommerce=shopify`
      )
        .then((r) => r.json())
        .then((r) => {
          setAbandonedCart(r);
        });
    }
  }, []);

  const tabs = [
    {
      id: "abandoned-checkouts",
      content: "Abandoned Checkouts",
      accessibilityLabel: "abandoned-checkouts",
      panelID: "abandoned-checkouts-content",
    },
    {
      id: "abandoned-carts",
      content: "Abandoned Carts",
      panelID: "abandoned-carts-content",
    },
  ];
  return (
    <Card>
      <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
        <Card.Section title={tabs[selected].content}>
          <ResourceListBody
            selected={selected}
            abandonedCart={abandonedCart}
            abandonedCheckout={abandonedCheckout}
          />
        </Card.Section>
      </Tabs>
    </Card>
  );
}

