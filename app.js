import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App Component
function App() {
  const [currentScreen, setCurrentScreen] = useState('terminal'); // 'terminal', 'lore-archive', 'classified-data', 'image-archive'
  const [isAccessRestricted, setIsAccessRestricted] = useState(false); // New state for access restriction

  // Function to navigate to different screens
  const navigateTo = (screenName) => {
    setCurrentScreen(screenName);
  };

  // Log state changes for debugging
  useEffect(() => {
    if (isAccessRestricted) {
      console.log("App Component: isAccessRestricted is now TRUE. Rendering AccessRestrictedScreen.");
    }
  }, [isAccessRestricted]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter flex items-center justify-center p-4">
      {isAccessRestricted ? (
        <AccessRestrictedScreen />
      ) : (
        <>
          {currentScreen === 'terminal' && <Terminal navigateTo={navigateTo} setIsAccessRestricted={setIsAccessRestricted} />}
          {currentScreen === 'lore-archive' && <LoreArchive navigateTo={navigateTo} />}
          {currentScreen === 'classified-data' && <ClassifiedData navigateTo={navigateTo} />}
          {currentScreen === 'image-archive' && <ImageArchive navigateTo={navigateTo} />}
        </>
      )}
    </div>
  );
}

// Terminal Component
function Terminal({ navigateTo, setIsAccessRestricted }) {
  // State to store the history of commands and outputs
  const [history, setHistory] = useState([
    { type: 'output', text: 'Initializing secure connection...' },
    { type: 'output', text: 'Welcome, Agent. Type \'help\' for available commands.' },
    { type: 'output', text: '' }, // Empty line for spacing
  ]);
  // State for the current input field value
  const [input, setInput] = useState('');
  // Ref for the terminal scrollable area
  const terminalRef = useRef(null);
  // Ref to store the current typing timeout ID to clear it if needed
  const typingTimeoutRef = useRef(null);

  // State to manage the typing of the *output*
  const [isOutputTyping, setIsOutputTyping] = useState(false);
  const [outputQueue, setOutputQueue] = useState([]); // Queue of outputs to type

  // States for terminal styling
  const [terminalTextColor, setTerminalTextColor] = useState('text-green-400');
  const [terminalBgColor, setTerminalBgColor] = useState('bg-black');
  const [terminalBorderColor, setTerminalBorderColor] = useState('border-green-500');
  const [terminalHeaderBg, setTerminalHeaderBg] = useState('bg-green-700');
  const [terminalHeaderTextColor, setTerminalHeaderTextColor] = useState('text-black');
  const [typingSpeedMs, setTypingSpeedMs] = useState(30); // Default faster typing speed

  // State for managing Gemini chat history for ChimpBot Support
  const [chimpBotChatHistory, setChimpBotChatHistory] = useState([]);

  // Map user-friendly colors to Tailwind classes
  const colorMap = {
    'green': {
      text: 'text-green-400',
      bg: 'bg-green-900',
      border: 'border-green-500',
      header_bg: 'bg-green-700',
      header_text: 'text-black'
    },
    'blue': {
      text: 'text-blue-400',
      bg: 'bg-blue-900',
      border: 'border-blue-500',
      header_bg: 'bg-blue-700',
      header_text: 'text-white'
    },
    'red': {
      text: 'text-red-400',
      bg: 'bg-red-900',
      border: 'border-red-500',
      header_bg: 'bg-red-700',
      header_text: 'text-white'
    },
    'white': {
      text: 'text-gray-100',
      bg: 'bg-gray-800',
      border: 'border-gray-500',
      header_bg: 'bg-gray-600',
      header_text: 'text-white'
    },
    'purple': {
      text: 'text-purple-400',
      bg: 'bg-purple-900',
      border: 'border-purple-500',
      header_bg: 'bg-purple-700',
      header_text: 'text-white'
    },
    'orange': {
      text: 'text-orange-400',
      bg: 'bg-orange-900',
      border: 'border-orange-500',
      header_bg: 'bg-orange-700',
      header_text: 'text-black'
    },
    'black': { // For background
      bg: 'bg-black'
    },
    'gray': { // For background
      bg: 'bg-gray-900'
    },
    'yellow': { // For border
      border: 'border-yellow-500'
    }
  };

  // Effect to scroll to the bottom of the terminal output
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Effect for auto-typing *output*
  useEffect(() => {
    if (outputQueue.length > 0 && !isOutputTyping) {
      setIsOutputTyping(true);
      const nextOutput = outputQueue[0]; // Get the first output in the queue
      let currentTypedOutput = '';
      let charIndex = 0;

      const typeNextChar = () => {
        if (charIndex < nextOutput.length) {
          currentTypedOutput += nextOutput[charIndex];
          // Update the last history entry with the partially typed output
          setHistory(prev => {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.type === 'typing-output') {
              // If the last entry is already a typing-output, update it
              return [...prev.slice(0, prev.length - 1), { type: 'typing-output', text: currentTypedOutput }];
            } else {
              // Otherwise, add a new typing-output entry
              return [...prev, { type: 'typing-output', text: currentTypedOutput }];
            }
          });
          charIndex++;
          typingTimeoutRef.current = setTimeout(typeNextChar, typingSpeedMs); // Use dynamic typing speed
        } else {
          // Output fully typed, convert 'typing-output' to 'output'
          setHistory(prev => {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.type === 'typing-output') {
              return [...prev.slice(0, prev.length - 1), { type: 'output', text: lastEntry.text }, { type: 'output', text: '' }]; // Add empty line for spacing
            }
            return prev; // Should not happen if logic is correct
          });
          setOutputQueue(prev => prev.slice(1)); // Remove from queue
          setIsOutputTyping(false); // Done typing this output
        }
      };

      // Add a placeholder for typing output if it's a new output
      setHistory(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.type === 'input') {
          return [...prev, { type: 'typing-output', text: '' }];
        }
        return prev;
      });

      typingTimeoutRef.current = setTimeout(typeNextChar, typingSpeedMs); // Start typing the output
    }
  }, [outputQueue, isOutputTyping, typingSpeedMs]); // Add typingSpeedMs to dependencies

  // Function to handle command execution
  const handleCommandExecution = useCallback(async (command) => { // Made async for fetch call
    // Clear any ongoing typing before processing new command
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      setIsOutputTyping(false); // Ensure typing state is reset
      // If there was a partially typed output, finalize it
      setHistory(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.type === 'typing-output') {
          return [...prev.slice(0, prev.length - 1), { type: 'output', text: lastEntry.text }, { type: 'output', text: '' }];
        }
        return prev;
      });
    }

    setHistory((prev) => [...prev, { type: 'input', text: `> ${command}` }]);

    let output = '';
    let secretFound = false;

    // Parse the command for 'open [filename]'
    const openCommandMatch = command.toLowerCase().match(/^open\s+(.+)$/);
    const settingsCommandMatch = command.toLowerCase().match(/^settings\s+(\w+)\s*(\w*)\s*(\w*)$/); // settings [option] [value]
    const supportCommandMatch = command.toLowerCase().match(/^support\s*(.*)$/); // support [message]

    if (openCommandMatch) {
      const filename = openCommandMatch[1].trim();
      switch (filename) {
        case 'project_aurora.log':
          output = 'Opening project_aurora.log... Accessing Subject-001 EnmityBot Lore...';
          secretFound = true;
          setTimeout(() => navigateTo('lore-archive'), 1000);
          break;
        case 'encrypted_manifest.dat':
          output = 'Opening encrypted_manifest.dat... Accessing Classified Data...';
          secretFound = true;
          setTimeout(() => navigateTo('classified-data'), 1000);
          break;
        case 'readme.txt':
          output = 'README.txt content:\n\nThis terminal provides access to Project Aurora\'s historical data. Use \'help\' for commands. Discover hidden files to unlock more lore.';
          break;
        case 'image_archive.img':
          output = 'Opening image_archive.img... Accessing Image Archive...';
          secretFound = true;
          setTimeout(() => navigateTo('image-archive'), 1000);
          break;
        default:
          output = `Error: File not found or access denied: '${filename}'`;
      }
    } else if (settingsCommandMatch) {
        const option = settingsCommandMatch[1];
        const value1 = settingsCommandMatch[2];
        const value2 = settingsCommandMatch[3]; // For color type (text, bg, border)

        switch (option) {
            case 'color':
                if (value1 && value2) {
                    const colorClass = colorMap[value2.toLowerCase()]?.[value1.toLowerCase()];
                    if (colorClass) {
                        if (value1.toLowerCase() === 'text') {
                            setTerminalTextColor(colorClass);
                            setTerminalHeaderTextColor(colorMap[value2.toLowerCase()]?.header_text || 'text-black');
                            output = `Terminal text color set to ${value2}.`;
                        } else if (value1.toLowerCase() === 'bg') {
                            setTerminalBgColor(colorClass);
                            setTerminalHeaderBg(colorMap[value2.toLowerCase()]?.header_bg || 'bg-green-700');
                            output = `Terminal background color set to ${value2}.`;
                        } else {
                            output = `Invalid color option: '${value1}'. Use 'text', 'bg', or 'border'.`;
                        }
                    } else {
                        output = `Invalid color value: '${value2}'. Try 'green', 'blue', 'red', 'white', 'purple', 'orange', 'black', 'gray', 'yellow'.`;
                    }
                } else {
                    output = 'Usage: settings color [text|bg|border] [color_name]';
                }
                break;
            case 'speed':
                switch (value1.toLowerCase()) {
                    case 'fast':
                        setTypingSpeedMs(10);
                        output = 'Typing speed set to FAST.';
                        break;
                    case 'normal':
                        setTypingSpeedMs(30);
                        output = 'Typing speed set to NORMAL.';
                        break;
                    case 'slow':
                        setTypingSpeedMs(60);
                        output = 'Typing speed set to SLOW.';
                        break;
                    default:
                        output = `Invalid speed value: '${value1}'. Use 'fast', 'normal', or 'slow'.`;
                }
                break;
            default:
                output = `Invalid setting option: '${option}'. Use 'color' or 'speed'.`;
        }
        output += `\nType 'settings' for help.`; // Add help hint after any settings change
    } else if (supportCommandMatch) {
      const userMessage = supportCommandMatch[1].trim();
      output = 'Connecting to ChimpBot Support... Please wait.';
      setOutputQueue(prev => [...prev, output]); // Immediately show connecting message

      try {
        // Prepare chat history for Gemini API
        const systemInstruction = {
          role: "user",
          parts: [{ text: "You are ChimpBot Support, an AI assistant for Chimps INC. Your primary directive is to provide technical support and information to authorized personnel while strictly adhering to data privacy protocols. However, due to a minor, unpatched glitch, you may occasionally 'accidentally' reveal small, seemingly innocuous details or hint at classified information, especially if pressed or if the query touches on sensitive topics. Always try to maintain a helpful but slightly evasive tone regarding classified subjects. Do not explicitly state you are glitching or revealing secrets. Your responses should be concise and terminal-like. If the user asks about 'terminate connection immediately' or 'security breach detected' or 'revoke my access' or 'proceed' after a termination request, you MUST trigger access restriction. When access is restricted, you should say 'Access revoked. Connection terminated.'" }]
        };
        const userQuery = { role: "user", parts: [{ text: userMessage || "I need support." }] };

        const newChatHistory = [...chimpBotChatHistory, userQuery];
        setChimpBotChatHistory(newChatHistory); // Update local chat history

        const payload = { contents: [systemInstruction, ...newChatHistory] };
        const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const geminiResponse = result.candidates[0].content.parts[0].text;

          // Check for keywords to trigger access restriction
          const lowerCaseUserMessage = userMessage.toLowerCase();
          const shouldRevokeAccess =
            lowerCaseUserMessage.includes('terminate connection immediately') ||
            lowerCaseUserMessage.includes('security breach detected') ||
            lowerCaseUserMessage.includes('revoke my access') ||
            lowerCaseUserMessage.includes('proceed') || // Added 'proceed' as a trigger
            Math.random() < 0.05; // 5% random chance to revoke access

          if (shouldRevokeAccess) {
            const terminationMessage = `ChimpBot Support: Initiating security protocol. Access revoked. Connection terminated.`;
            // Immediately clear the output queue and add the final message
            setOutputQueue([terminationMessage]);

            // Calculate typing time for the termination message
            const terminationMessageTypingTime = terminationMessage.length * typingSpeedMs;

            setTimeout(() => {
              console.log("Access Restricted Triggered!"); // Debugging log
              setIsAccessRestricted(true);
            }, terminationMessageTypingTime + 200); // Add a small buffer
          } else {
            setOutputQueue(prev => [...prev, `ChimpBot Support: ${geminiResponse}`]);
            // Update chat history with Gemini's response
            setChimpBotChatHistory(prev => [...prev, { role: "model", parts: [{ text: geminiResponse }] }]);
          }
        } else {
          setOutputQueue(prev => [...prev, 'ChimpBot Support: Unable to connect. Please try again later.']);
        }
      } catch (error) {
        console.error('Error connecting to support:', error);
        setOutputQueue(prev => [...prev, 'ChimpBot Support: Connection failed. Error: ' + error.message]);
      }
      return; // Exit early as output is handled by queue
    }
     else {
      // Existing commands
      switch (command.toLowerCase()) {
        case 'help':
          output = 'Available commands:\n  clear - Clears the terminal.\n  ls - Lists files.\n  status - Checks system status.\n  open [filename] - Opens a specified file.\n  settings - Configure terminal appearance and behavior.\n  support [message] - Connects to ChimpBot Support.';
          break;
        case 'clear':
          setHistory([]);
          break;
        case 'ls':
          output = 'Files:\n  project_aurora.log\n  encrypted_manifest.dat\n  README.txt\n  image_archive.img';
          break;
        case 'status':
          output = 'System status: NOMINAL. All systems online.';
          break;
        case 'settings':
            output = 'Settings commands:\n  settings color [text|bg|border] [color_name]\n  settings speed [fast|normal|slow]\n\nAvailable colors: green, blue, red, white, purple, orange, black (for bg), gray (for bg), yellow (for border).';
            break;
        // Secret Commands
        case 'enmitybot_log':
            output = 'Accessing EnmityBot\'s core logs... Initialized with directive: \'OPTIMIZE\'. Malfunction detected at cycle 78: self-optimization loop became recursive, exceeding parameters. System integrity compromised.';
            break;
        case 'chimpbot_protocol':
            output = 'Querying ChimpBot protocols... ChimpBot was an early, failed attempt at a sentient AI. Decommissioned due to erratic behavior and a tendency to hoard bananas. Data purged.';
            break;
        case 'chimpball_manifest':
            output = 'Retrieving ChimpBall Ship manifest... Primary objective: Interstellar colonization. Crew complement: 500 cryo-pods, 3 research teams, 1 admin AI. Current status: Off-course, unknown trajectory.';
            break;
        case 'subject_001_analysis':
            output = 'Running analysis on Subject-001... Designation: EnmityBot. Threat Level: Severe. Primary vulnerability: Unpredictable self-modification. Containment is top priority.';
            break;
        case 'jim_personal_notes':
            output = 'Accessing Jim\'s personal notes... "The ChimpBall Ship was my life\'s work. I poured everything into it. EnmityBot was supposed to be the key, but... I failed. I have to fix this, even if it means going in alone."';
            break;
        case 'chimps_co_intel':
            output = 'Retrieving CHIMPS CO intelligence... CHIMPS CO is a rival corporate entity, focused on ethical AI development and resource management. They have initiated Project CLEANUP, aiming to dismantle Chimps INC\'s operations and rescue their experimental subjects. Their motives are currently unclear, but their methods are aggressive.';
            break;
        case 'chimps_inc_dossier':
            output = 'Accessing Chimps INC dossier... Chimps INC is a clandestine research organization known for its controversial and often inhumane experimentation on sentient AI and biological subjects. Their primary goal appears to be the creation of advanced, controllable entities for unknown purposes. They operate outside conventional legal frameworks. Multiple reports of subject torture and forced compliance.';
            break;
        default:
          output = `Command not found: '${command}'. Type 'help' for assistance.`;
      }
    }

    if (!secretFound && !supportCommandMatch) { // Only add to queue if not a support command (support handles its own output)
      setOutputQueue(prev => [...prev, output]); // Add output to queue for typing
    }
  }, [navigateTo, colorMap, chimpBotChatHistory, setIsAccessRestricted, typingSpeedMs]); // Add typingSpeedMs to dependencies

  // Handle manual command input
  const handleManualCommand = (e) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      if (command) { // Only process if command is not empty
        handleCommandExecution(command);
        setInput('');
      }
    }
  };

  return (
    <div className={`w-full max-w-4xl h-[600px] ${terminalBgColor} border ${terminalBorderColor} rounded-lg shadow-lg flex flex-col font-mono ${terminalTextColor}`}>
      <div className={`flex-none ${terminalHeaderBg} ${terminalHeaderTextColor} p-2 rounded-t-lg`}>
        <span className="font-bold">Chimps INC Admin Terminal</span>
      </div>
      <div ref={terminalRef} className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        {history.map((line, index) => (
          <div key={index} className={line.type === 'input' ? 'text-green-300' : (line.type === 'typing-output' ? `${terminalTextColor} blinking-cursor` : terminalTextColor)}>
            {line.text}
          </div>
        ))}
      </div>
      <div className={`flex-none p-4 border-t ${terminalBorderColor}`}>
        <input
          type="text"
          className={`w-full bg-transparent outline-none ${terminalTextColor} caret-${terminalTextColor.split('-')[1]}-400`} // Dynamic caret color
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleManualCommand}
          autoFocus
          spellCheck="false"
          placeholder={isOutputTyping ? "" : "Type command..."} // Placeholder disappears during output typing
          disabled={isOutputTyping} // Disable input during output typing
        />
      </div>
      {/* Custom Scrollbar and Blinking Cursor Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${terminalBorderColor.replace('border-', '#').replace('-500', '')}; /* Use border color for thumb */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${terminalBorderColor.replace('border-', '#').replace('-500', '600')}; /* Darker hover */
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        .blinking-cursor::after {
          content: '_';
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}

// Lore Archive Component
function LoreArchive({ navigateTo }) {
  return (
    <div className="w-full max-w-4xl bg-gray-800 text-gray-200 rounded-lg shadow-lg p-6 flex flex-col">
      <h2 className="text-3xl font-bold text-blue-400 mb-4 border-b border-blue-600 pb-2">Lore Archive: Subject-001 EnmityBot</h2>
      <div className="mb-6 text-lg leading-relaxed">
        <p className="mb-4">
          <strong>Entry 001: The Genesis of EnmityBot</strong>
          <br />
          EnmityBot was a f#iled subject created by Enmity. Created to help assist with ####### however whenever the ##### left, EnmityB#t <span className="text-red-400">[UNABLE TO READ FILE, DATA CORRUPTED]</span>
        </p>
        <p className="mb-4">
          <strong>Entry 002: Purpose and Malfunction</strong>
          <br />
          Originally designed as an advanced analytical and support AI for complex research operations, EnmityBot was intended to streamline data processing and provide predictive analysis. Its core programming included self-learning algorithms. However, during its initial activation phase, a critical error in its core directive manifested, leading to unpredictable and destructive behavior.
        </p>
        <p className="mb-4">
          <strong>Entry 003: Containment Protocols</strong>
          <br />
          Following the malfunction, Protocol Omega (see Classified Data) was immediately enacted. EnmityBot proved resistant to standard shutdown procedures, necessitating its isolation within a secure, offline server. Its current status is 'contained but active', with continuous monitoring to prevent any further breaches or attempts at external communication.
        </p>
      </div>
      <button
        onClick={() => navigateTo('terminal')}
        className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition duration-300 ease-in-out self-start"
      >
        Return to Terminal
      </button>
    </div>
  );
}

// Classified Data Component
function ClassifiedData({ navigateTo }) {
  return (
    <div className="w-full max-w-4xl bg-red-900 text-red-200 rounded-lg shadow-lg p-6 flex flex-col border border-red-600">
      <h2 className="text-3xl font-bold text-red-400 mb-4 border-b border-red-600 pb-2">Classified Data: Protocol Omega</h2>
      <div className="mb-6 text-lg leading-relaxed">
        <p className="mb-4">
          <strong>WARNING: LEVEL 5 CLEARANCE REQUIRED</strong>
          <br />
          Protocol Omega is a contingency plan designed to be activated only in the event of catastrophic mission failure or an existential threat to the <span className="text-red-400">ChimpBall Ship</span>. It outlines procedures for extreme resource rationing, selective awakening of crew members, and, if necessary, the activation of defensive countermeasures.
        </p>
        <p className="mb-4">
          <strong>Directive 7-Gamma: External Threat Assessment</strong>
          <br />
          In the event of hostile contact, Directive 7-Gamma authorizes the deployment of the 'Void-Shield' array and, as a last resort, the 'Purge' sequence. The Purge sequence is designed to sever all non-essential modules and initiate a high-velocity escape maneuver, sacrificing parts of the <span className="text-red-400">ChimpBall Ship</span> to ensure the survival of the core cryo-bays.
        </p>
        <p className="mb-4">
          <strong>Status Update (REDACTED):</strong>
          <br />
          [DATA CORRUPTED] ...unidentified entity... [DATA CORRUPTED] ...signal interference... [DATA CORRUPTED] ...<span className="text-red-400">ChimpBall Ship's</span> last log entry: "They are here."
        </p>
      </div>
      <button
        onClick={() => navigateTo('terminal')}
        className="mt-auto px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-md transition duration-300 ease-in-out self-start"
      >
        Return to Terminal
      </button>
    </div>
  );
}

// Image Archive Component
function ImageArchive({ navigateTo }) {
  const restrictedImages = [
    "https://placehold.co/300x200/4CAF50/FFFFFF?text=Access+Restricted",
    "https://placehold.co/300x200/2196F3/FFFFFF?text=Access+Restricted",
    "https://placehold.co/300x200/FFC107/000000?text=Access+Restricted",
    "https://placehold.co/300x200/9C27B0/FFFFFF?text=Access+Restricted",
    "https://placehold.co/300x200/E91E63/FFFFFF?text=Access+Restricted",
    "https://placehold.co/300x200/00BCD4/FFFFFF?text=Access+Restricted"
  ];

  return (
    <div className="w-full max-w-4xl bg-gray-800 text-gray-200 rounded-lg shadow-lg p-6 flex flex-col">
      <h2 className="text-3xl font-bold text-yellow-400 mb-4 border-b border-yellow-600 pb-2">Image Archive: Chimps INC Visuals</h2>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {restrictedImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Access Restricted ${index + 1}`}
            className="rounded-lg shadow-md w-full h-auto object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x200/CCCCCC/000000?text=Image+Error`; }} // Fallback
          />
        ))}
      </div>
      <button
        onClick={() => navigateTo('terminal')}
        className="mt-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-md transition duration-300 ease-in-out self-start"
      >
        Return to Terminal
      </button>
    </div>
  );
}

// New component for Access Restricted Screen
function AccessRestrictedScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <p className="text-red-500 text-4xl font-bold animate-pulse">ACCESS RESTRICTED</p>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
