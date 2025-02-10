import { Page, Layout } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { BulkPriceUpdateContainer } from "../components";

export default function HomePage() {
  return (
    <Page narrowWidth>
      <TitleBar title="Change product prices" />
      <Layout>
        <Layout.Section>
          <BulkPriceUpdateContainer />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
