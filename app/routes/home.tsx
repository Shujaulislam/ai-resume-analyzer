import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import Navbar from "~/components/Navbar";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart Feedback For your Dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true);

            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            const parsedResumes = resumes?.map((resume) => (
                JSON.parse(resume.value) as Resume
            ))
            console.log("parsedResumes", parsedResumes);
            setResumes(parsedResumes || []);
            setLoadingResumes(false);
        }
        loadResumes();
    }, []);

  useEffect(() => {
    if(!auth.isAuthenticated) (navigate('auth/?next=/'));

  }, [auth.isAuthenticated]);
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar/>

    <section className="main-section">
      <div className="page-heading py-16">
        <h1 className="page-heading">Track your Applications and Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
              <h2>No resumes found, Upload your first resume to get feedback.</h2>
          ) : (
              <h2>Review your submissions and check AI-powered Feedback</h2>
          )}
      </div>
        {loadingResumes && (
            <div className="flex flex-col items-center justify-center">
                <img src="/images/resume-scan-2.gif" className="w-[200px] w-"/>
            </div>
        )}

      {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map(resume => (
                <div>
                  <ResumeCard key={resume.id} resume={resume} />
                </div>
            ))}
          </div>
      )}
        {!loadingResumes && resumes.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 gap-4">
                <Link to="/upload" className="primary-button w-fit text-xl font-semibold" >
                    Upload Resume
                </Link>
            </div>
        )}
    </section>
  </main>
}
