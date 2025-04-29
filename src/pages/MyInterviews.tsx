import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Interview {
  id: string;
  created_at: string;
  topic: string;
  difficulty: string;
  feedback: string;
  questions_answers: {
    question: string;
    answer: string;
  }[];
}

const MyInterviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  // Format the interview topic to be more readable
  const formatTopic = (topic: string) => {
    return topic
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get badge color based on difficulty
  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Load user's interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      setIsLoading(true);

      try {
        // Calculate pagination values
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        // Get interviews from the database with pagination
        const {
          data: interviews,
          error,
          count,
        } = await supabase
          .from("interviews")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          throw error;
        }

        if (count !== null) {
          setTotalPages(Math.ceil(count / pageSize));
        }

        setInterviews(interviews as Interview[]);
      } catch (error: any) {
        console.error("Error fetching interviews:", error);
        toast({
          title: "Error fetching interviews",
          description:
            error.message || "There was an error loading your interviews.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, [user, navigate, currentPage, toast]);

  // View interview details
  const viewInterviewDetails = (interview: Interview) => {
    navigate(`/feedback`, {
      state: {
        feedback: interview.feedback,
        interviewData: interview.questions_answers,
        interviewId: interview.id,
        config: {
          topic: interview.topic,
          difficulty: interview.difficulty,
        },
        fromHistory: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            My Interviews
          </h1>
          <Button onClick={() => navigate("/create-interview")}>
            Start New Interview
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Your Interview History</CardTitle>
            <CardDescription>
              Review your past interviews and track your progress over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : interviews.length === 0 ? (
              // No interviews message
              <div className="text-center py-12">
                <p className="text-gray-500 mb-6">
                  You haven't completed any interviews yet.
                </p>
                <Button onClick={() => navigate("/create-interview")}>
                  Start Your First Interview
                </Button>
              </div>
            ) : (
              // Interview table
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium">
                          {formatDate(interview.created_at)}
                        </TableCell>
                        <TableCell>{formatTopic(interview.topic)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getDifficultyBadgeVariant(
                              interview.difficulty
                            )}
                          >
                            {interview.difficulty.charAt(0).toUpperCase() +
                              interview.difficulty.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewInterviewDetails(interview)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && interviews.length > 0 && totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;

                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === totalPages - 1 &&
                          currentPage < totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button onClick={() => navigate("/create-interview")}>
              New Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MyInterviews;
