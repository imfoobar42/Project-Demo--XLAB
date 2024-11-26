# Instructions to Run the Project\n\n### To run the Frontend:\n```\ncd ./Frontend\nnpm start\n```\n\n### To run the Backend:\n```\ncd ./Backend\nnpm start\n```\n\n### To run the Transcription Service:\n```\ncd ./Transcription\nuvicorn app:app --host [host] --port [port no.]\n```\n\n### Environment Variables:\n- The **Frontend** and **Backend** have their own `.env` files to manage environment variables. These files allow you to configure settings such as ports, URLs, and other dynamic variables without modifying the source code directly.\n\n- The **Transcription Service** can simply be run using the `uvicorn` command as mentioned above, where the host and port can be specified dynamically in the command.