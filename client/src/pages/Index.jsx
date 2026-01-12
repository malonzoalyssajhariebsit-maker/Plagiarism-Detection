import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSearch, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkTextSchema } from "../../../shared/schema";
import jsPDF from "jspdf";

const Index = () => {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const {
    toast
  } = useToast();
  const handleCheck = async () => {
    if (!studentName.trim() || !studentId.trim() || !title.trim()) {
      toast({
        title: "Error",
        description: "Please enter student name, ID, and title",
        variant: "destructive"
      });
      return;
    }
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to check",
        variant: "destructive"
      });
      return;
    }

    // Validate using Zod schema
    const validation = checkTextSchema.safeParse({ text });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setResult(null);
    try {
      const response = await fetch('/api/plagiarism-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text
        })
      });
      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }
      const data = await response.json();
      setResult(data);
      toast({
        title: "Check Complete",
        description: `Plagiarism score: ${data.plagiarismPercentage}%`
      });
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast({
        title: "Error",
        description: "Failed to check plagiarism. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const data = result || placeholderResult;
    
    // Constants for layout
    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (2 * margin);
    const generatedDate = new Date().toLocaleString();
    
    let currentY = margin;
    let pageNumber = 1;
    
    // Utility: Check if we need a new page
    const checkPageBreak = (neededSpace) => {
      if (currentY + neededSpace > pageHeight - margin - 20) {
        doc.addPage();
        pageNumber++;
        addHeader();
        currentY = margin + 25;
        addFooter();
      }
    };
    
    // Header function
    const addHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PLMUN:TCAP", margin, 15);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Plagiarism Detection Report", margin, 20);
      
      // Header line
      doc.setLineWidth(0.5);
      doc.line(margin, 22, pageWidth - margin, 22);
    };
    
    // Footer function
    const addFooter = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const totalPages = doc.internal.getNumberOfPages();
      doc.text(`Page ${pageNumber}`, margin, pageHeight - 10);
      doc.text(`Generated: ${generatedDate}`, pageWidth - margin - 40, pageHeight - 10);
    };
    
    // Section title function
    const addSectionTitle = (title, spaceAfter = 8) => {
      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, margin, currentY);
      currentY += spaceAfter;
    };
    
    // Body text function with wrapping
    const addBodyText = (text, fontSize = 10, spaceAfter = 6) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      const textHeight = lines.length * (fontSize * 0.4);
      
      checkPageBreak(textHeight + spaceAfter);
      
      doc.text(lines, margin, currentY);
      currentY += textHeight + spaceAfter;
    };
    
    // Key-value pair function
    const addKeyValue = (key, value, highlight = false) => {
      checkPageBreak(8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(key + ":", margin, currentY);
      
      if (highlight) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      
      doc.text(value, margin + 50, currentY);
      currentY += 6;
    };
    
    // Separator line
    const addSeparator = () => {
      checkPageBreak(8);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
    };
    
    // Start building the document
    addHeader();
    currentY = margin + 25;
    
    // Report Title (use inputted title)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(title || "[Title]", contentWidth);
doc.text(titleLines, margin, currentY);
currentY += titleLines.length * 10 + 5; // Adjust spacing as needed
    currentY += 15;
    
    addSeparator();
    
    // Student Information Section
    addSectionTitle("Student Information");
    addBodyText(`Name: ${studentName || "[Student Name]"}\nStudent ID: ${studentId || "[Student ID]"}\nSubmission Date: ${new Date().toLocaleDateString()}`);
    currentY += 5;
    
    // Submitted Text Section
    addSectionTitle("Submitted Text");
    addBodyText(`Title: ${title || "[Title]"}\n${text || "No text submitted for analysis."}`);
    currentY += 5;
    
    // Results Summary Section
    addSectionTitle("Analysis Results");
    addKeyValue("Overall Plagiarism", data.plagiarismPercentage + "%", true);
    addKeyValue("Similarity Score", data.overallScore + "%", true);
    addKeyValue("Total Sentences", data.totalSentences.toString());
    addKeyValue("Flagged Sentences", data.plagiarizedSentences.toString());
    
    const cleanPercentage = ((data.plagiarizedSentences / data.totalSentences) * 100) || 0;
    addKeyValue("Flagged Percentage", cleanPercentage.toFixed(1) + "%");
    currentY += 8;
    
    // Status based on plagiarism percentage
    let status = "PASS";
    let statusColor = [0, 150, 0]; // Green
    if (data.plagiarismPercentage > 15) {
      status = "REVIEW REQUIRED";
      statusColor = [200, 100, 0]; // Orange
    }
    if (data.plagiarismPercentage > 30) {
      status = "FAIL";
      statusColor = [200, 0, 0]; // Red
    }
    
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...statusColor);
    doc.text("Status: " + status, margin, currentY);
    doc.setTextColor(0, 0, 0); // Reset to black
    currentY += 15;
    
    addSeparator();
    
    // Detailed Analysis Section
    addSectionTitle("Detailed Analysis");
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((item, index) => {
        checkPageBreak(25);
        
        // Sentence number and status
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const statusText = item.isPlagiarized ? " [FLAGGED]" : " [CLEAN]";
        const statusColor = item.isPlagiarized ? [200, 0, 0] : [0, 150, 0];
        
        doc.text(`Sentence ${index + 1}:`, margin, currentY);
        doc.setTextColor(...statusColor);
        doc.text(statusText, margin + 30, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 6;
        
        // Sentence text
        addBodyText(item.sentence, 10, 4);
        
        // Similarity score
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Similarity: ${item.similarity}%`, margin + 5, currentY);
        currentY += 8;
        
        // Sources if any
        if (item.sources && item.sources.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text("Sources:", margin + 5, currentY);
          currentY += 4;
          
          item.sources.forEach((source, idx) => {
            checkPageBreak(6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            const sourceText = `${idx + 1}. ${source.url} (${source.similarity}%)`;
            const wrappedSource = doc.splitTextToSize(sourceText, contentWidth - 10);
            doc.text(wrappedSource, margin + 10, currentY);
            currentY += wrappedSource.length * 3;
          });
        }
        
        currentY += 5; // Space between sentences
      });
    } else {
      addBodyText("No detailed results available.");
    }
    
    // Final footer
    addFooter();
    
    // Save the document
    doc.save("PLMUN-TCAP-Plagiarism-Report.pdf");
  };
  const getScoreColor = score => {
    if (score < 20) return "text-green-600 dark:text-green-400";
    if (score < 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Example placeholder data for initial display
  const placeholderResult = {
    plagiarismPercentage: 0,
    overallScore: 0,
    totalSentences: 0,
    plagiarizedSentences: 0,
    results: [
      {
        sentence: "Your results will appear here after checking.",
        similarity: 0,
        isPlagiarized: false,
        sources: []
      }
    ]
  };

  // Circular progress component with new palette
  const CircularProgress = ({ value = 0, label = "Plagiarized", color = "#F9E07F", size = 120 }) => {
    const radius = (size - 16) / 2;
    const stroke = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return (
      <svg width={size} height={size} className="mx-auto block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#132030"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s' }}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="2em"
          fill="#ecfaffff"
          fontWeight="bold"
        >
          {value}%
        </text>
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="1em"
          fill="#D3D0DC"
        >
          {label}
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A1623] text-[#D3D0DC] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'scroll', height: '100vh' }}>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[90vh]">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-[#F9E07F] to-[#0CE3F3] bg-clip-text text-transparent drop-shadow-lg">
            PLMUN:TCAP <br /> Plagiarism Detection
          </h1>
          <p className="text-[#D3D0DC] text-xl max-w-2xl mx-auto">
            Detect possible plagiarism present within your thesis or capstone submissions.
          </p>
        </div>
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Input Box */}
          <div className="md:w-1/2 w-full">
            <Card className="shadow-2xl border-none bg-[#132030]" data-testid="card-input">
              <CardHeader>
                <CardTitle className="text-[#fff7c7ff]">Enter Text</CardTitle>
                <CardDescription className="text-[#D3D0DC]">
                  Insert your text below to run a plagiarism scan against online references.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info Inputs */}
                <input
                  type="text"
                  placeholder="Student Name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="mb-2 p-2 w-full rounded bg-[#0A1623] border border-[#0CE3F3] text-[#D3D0DC]"
                />
                <input
                  type="text"
                  placeholder="Student ID"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="mb-2 p-2 w-full rounded bg-[#0A1623] border border-[#0CE3F3] text-[#D3D0DC]"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mb-4 p-2 w-full rounded bg-[#0A1623] border border-[#0CE3F3] text-[#D3D0DC]"
                />
                <Textarea data-testid="input-text" placeholder="Paste your text here (minimum 100 characters)..." value={text} onChange={e => setText(e.target.value)} className="min-h-[200px] text-base bg-[#0A1623] text-[#D3D0DC] border border-[#0CE3F3] focus:border-[#fff7c7ff]" />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm text-[#fff7c7ff]" data-testid="text-character-count">
                    {text.length} characters
                  </p>
                  <Button data-testid="button-check-plagiarism" onClick={handleCheck} disabled={isChecking || text.length < 100} size="lg" className="bg-gradient-to-r from-[#9be9ffff] to-[#9be9ffff] text-[#132030] hover:from-[#F9E07F] hover:to-[#F9E07F]">
                    {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#132030]" />}
                    {isChecking ? "Checking..." : "Check Plagiarism"}
                  </Button>
                </div>

                {isChecking && <Alert data-testid="alert-checking" className="bg-[#132030] border-l-4 border-[#0CE3F3]">
                    <AlertCircle className="h-4 w-4 text-[#0CE3F3]" />
                    <AlertDescription className="text-[#D3D0DC]">
                      This may take 30-60 seconds as we search the web and compare your text...
                    </AlertDescription>
                  </Alert>}
              </CardContent>
            </Card>
          </div>

          {/* Right: Results (always displayed) */}
          <div className="md:w-1/2 w-full">
            <div className="space-y-8">
              <Card className="shadow-2xl border-none bg-[#132030]" data-testid="card-report">
                <CardHeader>
                  <CardTitle className="text-[#fff7c7ff]">Plagiarism Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center p-8 bg-[#0A1623] rounded-xl shadow flex flex-col items-center justify-center">
                      <CircularProgress value={(result || placeholderResult).plagiarismPercentage} label="Plagiarized" color="#ff5151ff" size={120} />
                      <p className="text-sm text-[#ff5151ff] mt-4">Overall Plagiarism</p>
                    </div>
                    <div className="text-center p-8 bg-[#0A1623] rounded-xl shadow flex flex-col items-center justify-center">
                      <CircularProgress value={(result || placeholderResult).overallScore} label="Similarity" color="#77c859ff" size={120} />
                      <p className="text-sm text-[#77c859ff] mt-4">Similarity Score</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#fff7c7ff]">Sentences Analyzed</span>
                      <span className="font-semibold text-[#fff7c7ff]" data-testid="text-total-sentences">{(result || placeholderResult).totalSentences}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#fff7c7ff]">Plagiarized Sentences</span>
                      <span className="font-semibold text-[#fff7c7ff]" data-testid="text-plagiarized-sentences">{(result || placeholderResult).plagiarizedSentences}</span>
                    </div>
                    {/* Custom chart-style progress bar */}
                    <div className="w-full h-6 bg-[#0A1623] rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#c1ff75ff] to-[#b83c3cff] transition-all duration-700"
                        style={{ width: `${((result || placeholderResult).totalSentences ? (result || placeholderResult).plagiarizedSentences / (result || placeholderResult).totalSentences * 100 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-none bg-[#132030]" data-testid="card-details">
                <CardHeader>
                  <CardTitle className="text-[#FFF]">Detailed Results</CardTitle>
                  <CardDescription className="text-[#FFF]">Sentence-by-sentence analysis with sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(result || placeholderResult).results.map((item, index) => <div key={index} data-testid={`result-sentence-${index}`} className={`p-6 rounded-xl border-2 ${item.isPlagiarized ? "bg-gradient-to-r from-[#a42d2daf] to-[#132030] border-[#a42d2daf]" : "bg-gradient-to-r from-[#2a8436bc] border-[#359e43ff]"} bg-transparent`}>
                        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                          <p className="text-base font-medium flex-1 text-[#FFFFFF]" data-testid={`text-sentence-${index}`}>{item.sentence}</p>
                          <span data-testid={`badge-similarity-${index}`} className={`px-4 py-2 rounded-full text-base font-bold ${item.isPlagiarized ? "bg-[#ffc3c3ff] text-[#132030]" : "bg-[#89ff99ff] text-[#132030]"}`}>
                            {item.similarity}%
                          </span>
                        </div>
                        {item.sources.length > 0 && <div className="mt-2 pt-2 border-t border-current/20">
                            <p className="text-xs font-semibold mb-1 text-[#FFFFFF]">Potential Sources:</p>
                            <div className="space-y-1">
                              {item.sources.map((source, idx) => <div key={idx} className="flex items-start gap-2">
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" data-testid={`link-source-${index}-${idx}`} className={`flex-1 text-xs hover:underline truncate ${source.similarity >= 50 ? "text-[#ffc3c3ff] font-semibold" : "text-[#baffc3ff]"}`}>
                                    {source.url}
                                  </a>
                                  <span className={`text-xs font-bold ${source.similarity >= 50 ? "text-[#ffc3c3ff]" : "text-[#baffc3ff]"}`} data-testid={`text-source-similarity-${index}-${idx}`}> 
                                    {source.similarity}%
                                  </span>
                                </div>)}
                            </div>
                          </div>}
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Download PDF Button - Moved to center below main content */}
        <div className="mt-8 w-full flex justify-center">
          <Button 
            onClick={handleDownloadPDF} 
            className="w-full max-w-md bg-[#0CE3F3] text-[#132030] font-bold hover:bg-[#F9E07F]"
          >
            Download PDF Report
          </Button>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
};

export default Index;