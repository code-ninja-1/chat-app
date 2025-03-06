import * as yup from "yup";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import AuthContext from "../context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup.object().shape({
  username: yup.string().matches(/^[A-Za-z][A-Za-z0-9_]*$/, "Username must start with a letter, contain only letters, numbers, and underscores").min(3, "Username must be at least 3 characters").required("Username is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: yup.string().oneOf([yup.ref("password"), null], "Passwords must match").required("Confirm Password is required"),
});

const Register = () => {
  const { register: signup } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = (data) => signup(data.username, data.password);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl mb-4">Register</h2>
      <form className="flex flex-col items-center w-72" onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full">
          <input {...register("username")} className="border p-2 rounded w-full" placeholder="Username" />
          <p className="text-red-500 text-sm text-center w-full min-h-[20px]">{errors.username?.message}</p>
        </div>

        <div className="w-full">
          <input type="password" {...register("password")} className="border p-2 rounded w-full mt-2" placeholder="Password" />
          <p className="text-red-500 text-sm text-center w-full min-h-[20px]">{errors.password?.message}</p>
        </div>

        <div className="w-full">
          <input type="password" {...register("confirmPassword")} className="border p-2 rounded w-full mt-2" placeholder="Confirm Password" />
          <p className="text-red-500 text-sm text-center w-full min-h-[20px]">{errors.confirmPassword?.message}</p>
        </div>

        <button className="bg-green-500 text-white px-4 py-2 rounded mt-3 w-full">Register</button>
      </form>
      <p className="mt-2">Already have an account? <a href="/login" className="text-blue-500">Login</a></p>
    </div>
  );
};

export default Register;
