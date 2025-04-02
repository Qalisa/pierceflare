const IndexPage = () => {
  //
  return (
    <>
      <h1>CloudFlare</h1>
      <h2>Login</h2>
      <form method="POST">
        <fieldset className="fieldset">
          <input
            name="username"
            type="text"
            className="input"
            placeholder="Username"
            required
          />
        </fieldset>
        <fieldset className="fieldset">
          <input
            name="password"
            type="password"
            className="input"
            placeholder="Password"
            required
          />
        </fieldset>
        <input type="submit" className="btn" />
      </form>
    </>
  );
};

export default IndexPage;
