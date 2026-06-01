import type { NextPageContext } from "next";

type ErrorProps = {
  statusCode?: number;
};

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>{statusCode ? `Error ${statusCode}` : "Error"}</h1>
      <p>
        <a href="/sign-in">Return to sign in</a>
      </p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};
