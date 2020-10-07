import React from "react";

import {
  ResourceItem,
  ResourceList,
  Avatar,
  TextStyle,
  Button,
} from "@shopify/polaris";

export default function ResourceListBody({
  selected,
  abandonedCheckout,
  abandonedCart,
}) {
  if (selected === 0) {
    return (
      <ResourceList
        resourceName={{ singular: "order", plural: "orders" }}
        items={abandonedCheckout}
        renderItem={(item) => {
          const { abandoned_checkout_link, created_at, customer, name } = item;
          const media = (
            <Avatar customer size="medium" name={customer.first_name} />
          );

          return (
            <ResourceItem id={name} url={abandoned_checkout_link} media={media}>
              <h3>
                <TextStyle variation="strong">{customer.first_name}</TextStyle>
              </h3>
              <div>{created_at}</div>
              <Button>Notify</Button>
            </ResourceItem>
          );
        }}
      />
    );
  } else {
    return (
      <ResourceList
        resourceName={{ singular: "order", plural: "orders" }}
        items={abandonedCart}
        renderItem={(item) => {
          const { customer_id, customer_phone, customer_name} = item;
          const media = <Avatar customer size="medium" name={customer_id} />;

          return (
            <ResourceItem id={customer_id} media={media}>
              <h3>
                <TextStyle variation="strong">{customer_name}</TextStyle>
                Phone: {customer_phone}
              </h3>
              <Button>Notify</Button>
            </ResourceItem>
          );
        }}
      />
    );
  }
}
