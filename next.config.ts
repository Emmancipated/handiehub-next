import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/seller/listings",
        destination: "/dashboard/seller/listings",
        permanent: false,
      },
      {
        source: "/seller/listings/new",
        destination: "/dashboard/seller/listings/new",
        permanent: false,
      },
      {
        source: "/order",
        destination: "/dashboard/customer/orders",
        permanent: false,
      },
      {
        source: "/user/edit-profile",
        destination: "/settings/profile",
        permanent: false,
      },
    ];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
    // The app's route pages are client components, so they have no static
    // shell yet. Implicit instant-navigation validation flags every load and
    // triggers a Fast Refresh reload loop in development. Validate only
    // segments that explicitly opt in until the pages are server-rendered.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
