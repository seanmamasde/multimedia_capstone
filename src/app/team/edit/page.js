"use client";

import AppMenubar from "../../menubar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { decodeJwt } from "@/utils/jwtAuth";

export default function TeamEdit() {
    const [ team, setTeam ] = useState(null);
    const [ uid, setUid ] = useState(null);

    const router = useRouter();
    console.log(window.location.href);


    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.href.split('?')[1]);
        const tid = queryParams.get("tid");
        
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
    
        try {
          const payload = JSON.parse(decodeJwt(token));
          setUid(payload.id);
        } catch (error) {
          console.error("Failed to decode token:", error);
          localStorage.removeItem("token");
          router.push("/login");
        }
    
        const fetchTeam = async () => {
          const res = await fetch(`/api/dbConnect/teamByTid?tid=${tid}`);
          const data = await res.json();
          setTeam(data);
        };
    
        fetchTeam();
    }, [router]);
    
    const TeamEditField = () => {
        if (team != null) {
            if ([team.uid1, team.uid2, team.uid3, team.uid4].includes(uid)) {
                return (
                    <div>
                        permission to edit
                    </div>
                )
            } else {
                return (
                    <div>
                        You do not have permission to view this page.
                    </div>
                )
            }
        }
    }


    return (
        <div>
            <AppMenubar />
            <h2> TeamEdit</h2>
            <TeamEditField />
        </div>
    )
}