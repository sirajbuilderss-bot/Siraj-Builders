import { Component } from "react";

/**
 * Catches render errors in the routed page tree.
 *
 * Without this, any thrown error in a page component unmounts the entire
 * React tree and leaves the visitor on a blank white screen with no way
 * back. This keeps the shell intact and offers a recovery path.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Replace with a real error-reporting service when one is configured.
    if (process.env.NODE_ENV !== "production") {
      console.error("Page render error:", error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="notfound">
          <div className="container notfound-inner">
            <span className="eyebrow">Something went wrong</span>
            <h1 className="notfound-title">This page could not be displayed.</h1>
            <p className="notfound-lead">
              Something failed while loading this page. Try again, or return to
              the homepage and continue from there.
            </p>
            <div className="notfound-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={this.handleRetry}
              >
                Try again
              </button>
              <a className="btn btn-ghost" href="/">
                Back to home <span className="arrow">→</span>
              </a>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
