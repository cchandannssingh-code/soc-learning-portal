4624: An account was successfully logged on

On this page

Description of this event
Field level details
Examples
This is a highly valuable event since it documents each and every successful attempt to logon to the local computer regardless of logon type, location of the user or type of account.  You can tie this event to logoff events 4634 and 4647 using Logon ID.

Win2012 adds the Impersonation Level field as shown in the example.

Win2016/10 add further fields explained below.


public/
 └── images/
      ├── kerberos-flow.png
      ├── event-4648-diagram.png
      └── psexec-flow.png


      # Kerberos Authentication Flow

![Kerberos Flow](/images/kerberos-flow.png)

## Explanation

Client requests TGT from KDC.