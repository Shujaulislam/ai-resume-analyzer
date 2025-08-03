import type { Route } from "./+types/home";
import {resumes} from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import Navbar from "~/components/Navbar";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {useEffect} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart Feedback For your Dream job!" },
  ];
}

export default function Home() {
  const { auth } = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if(!auth.isAuthenticated) (navigate('auth/?next=/'));

  }, [auth.isAuthenticated]);
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>

    <section className="main-section">
      <div className="page-heading py-16">
        <h1 className="page-heading">Track your Applications and Resume Ratings</h1>
        <h2>Review your submissions and check AI-powered Feedback</h2>
      </div>

      {resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map(resume => (
                <div>
                  <ResumeCard key={resume.id} resume={resume} />
                </div>
            ))}
          </div>
      )}
    </section>
  </main>
}
