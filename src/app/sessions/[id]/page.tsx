"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch session data");
      }
      const data = await response.json();
      setSessionData(data);
      setError(null);
    } catch (err) {
      setError("Error loading session data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Session Data...</CardTitle>
            <CardDescription>Please wait while we load the job postings</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Session</CardTitle>
            <CardDescription>{error || "Failed to load session data"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchSessionData}>Try Again</Button>
            <Link href="/" className="ml-4">
              <Button variant="outline">Go Back</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, jobData } = sessionData;
  const jobPostings = jobData?.jobPostings || [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to all sessions
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>
                Started on {new Date(session.startTime).toLocaleString()}
              </CardDescription>
            </div>
            <Badge variant={session.status === "complete" ? "default" : "secondary"}>
              {session.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-2xl font-semibold">
                {Math.floor(session.duration / 60)}m {session.duration % 60}s
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Jobs Found</div>
              <div className="text-2xl font-semibold">{jobPostings.length}</div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Processing Time</div>
              <div className="text-2xl font-semibold">
                {Math.floor(session.processingTime / 60)}m {session.processingTime % 60}s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Postings ({jobPostings.length})</CardTitle>
          <CardDescription>
            Jobs captured during your LinkedIn browsing session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobPostings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No job postings were found in this session.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobPostings.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.role || "Unknown Role"}</TableCell>
                    <TableCell>{job.company || "Unknown Company"}</TableCell>
                    <TableCell>{job.location || "-"}</TableCell>
                    <TableCell>{job.experienceRequired || "-"}</TableCell>
                    <TableCell>{job.salaryInfo || "-"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => alert("Job details: " + job.rawText)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}