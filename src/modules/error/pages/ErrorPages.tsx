 import { useRouteError } from "react-router-dom";

const ErrorPages = () => {
    const error = useRouteError();
let errorMessage = "Error desconocido";

  if (error instanceof Response) {
    errorMessage = `Error ${error.status}: ${error.statusText}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  return (
    <>
    <h1>Error personalizado</h1>
      <p>{errorMessage}</p>
    </>
  )
}

export default ErrorPages
