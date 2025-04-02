import appLogo from "@/assets/images/logo.webp";

const IndexPage = () => {
  //
  return (
    <>
      <div className="card">
        <figure>
          <img alt="" src={appLogo} width="100px" />
        </figure>
        <form className="card-body" method="POST">
          <h2 className="card-title">Login</h2>
          <fieldset className="fieldset">
            <input
              name="username"
              type="text"
              className="input"
              placeholder="Username"
              autoComplete="username"
              required
            />
          </fieldset>
          <fieldset className="fieldset">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="Password"
              required
            />
          </fieldset>
          <input type="submit" className="btn btn-block" />
        </form>
      </div>
    </>
  );
};

export default IndexPage;
