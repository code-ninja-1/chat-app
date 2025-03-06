import * as yup from "yup";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import AuthContext from "../context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSnackbar } from "../context/SnackbarContext";

const schema = yup.object().shape({
  username: yup.string().required("Username is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Login = () => {
  const { login } = useContext(AuthContext);
  const { showSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data.username, data.password);
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl mb-4">Login</h2>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <input {...register("username")} className="border p-2 rounded w-64" placeholder="Username" />
        <p className="text-red-500 text-sm">{errors.username?.message}</p>

        <input type="password" {...register("password")} className="border p-2 rounded w-64 mt-2" placeholder="Password" />
        <p className="text-red-500 text-sm">{errors.password?.message}</p>

        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-3" type="submit">Login</button>
      </form>
      <p className="mt-2">No account? <a href="/register" className="text-blue-500">Register</a></p>
    </div>
  );
};

export default Login;
