// import 'dart:convert';
// import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:mobile/escavalon_material.dart';

enum Team { good, evil, }

FlutterSecureStorage? globalToken;
int globalNumPlayers = 5;
Map<String, bool> globalRolesSelected = {
  "Merlin": false,
  "Percival": false,
  "Assassin": false,
  "Morgana": false,
  "Oberon": false,
  "Mordred": false,
};

class GamePage extends StatelessWidget {
  final FlutterSecureStorage? token;
  final int numPlayers;
  final Map<String, bool> rolesSelected;
  
  const GamePage({
    super.key,
    required this.token,
    required this.numPlayers,
    required this.rolesSelected,
  });

  @override
  Widget build(BuildContext context) {
    globalToken = token;
    globalNumPlayers = numPlayers;
    globalRolesSelected = rolesSelected;

    return Scaffold(
      appBar: AppBar(
          backgroundColor: Theme.of(context).colorScheme.inversePrimary,
          title: Text("Escavalon"),
        ),
        body: Center(
          child: 
            Container(
              padding: const EdgeInsets.all(16.0), 
              child: _GamePageContent()
            )
        ),
    );
  }
}

class _GamePageContent extends StatefulWidget {
  const _GamePageContent();

  @override
  State<_GamePageContent> createState() => _GamePageContentState();
}

class _GamePageContentState extends State<_GamePageContent> {
  final startTime = DateTime.now();
  Team? winner;
  int questNum = 1;
  final Map<Team, int> numVictories = {
    Team.good: 0,
    Team.evil: 0,
  };

  int gamePhase = 0; // 0: start, 1: quests, 2: assassinate, 3: end
  List<Team?> questResults = List<Team?>.generate(5, (int idx) => null, growable: false);

  Future<bool>? _gameSavedSuccessfully;
  final bool _gameSaved = false; // TODO: make this less of a mess

  FlutterTts flutterTts = FlutterTts();

  @override
  void initState() {
    super.initState();
    flutterTts.setLanguage("en-US");
    flutterTts.setSpeechRate(0.5);
    flutterTts.setVolume(1.0);
  }

  @override
  Widget build(BuildContext context) {
    switch (gamePhase) {
      case 0:
        return Builder(
          builder: (context) => _Night(
            // TODO: stop exception happenning at end of night
            updateGamePhase: (newPhase) => setState(() {
              gamePhase = newPhase;
            }),
            flutterTts: flutterTts,
          )
        );
      case 1:
        return Text("Questing...");
      case 2:
        // evil already won -- they don't need to try to assassinate Merlin
        if (numVictories[Team.evil] == 3) {
          setState(() {
            gamePhase = 3;
          });
        }
        // TODO: implement Merlin assassination
        return Text("Assassinating Merlin...");
      case 3:




        return endGame(context);
      default:
        throw ErrorDescription("Invalid game phase: $gamePhase");
    }
  }

  void runQuest(BuildContext context) {
    // TODO: say number of players
    // TODO: time discussion
    // TODO: vote for team (repeat until vote passes)
    // TODO: run quest and return results
  }

  // not yet tested
  Widget endGame(BuildContext context) {
    // if user is logged in, we can try to save the game
    if (globalToken != null) {
      _gameSavedSuccessfully = trySave();
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        EscavalonCard(
          child: Text(
            "Game Over!\nVictory for:\n${winner == Team.good ? "Good" : "Evil"}",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          )
        ),

        // save game status
        Builder(
          builder: (context) {
            if (globalToken != null) {
              return saveStatus(context);
            } else {
              return const SizedBox.shrink();
            }
          }
        ),

        EscavalonButton(
          text: "Return to Home Screen",
          onPressed: () {
            bool returnToHome = true;

            if (globalToken != null && _gameSaved == false) {
              showDialog(
                context: context, 
                builder: (context) => AlertDialog(
                  title: const Text("Warning!"),
                  content: const Text("Game not saved. Are you sure you want to return to the home screen?"),
                  actions: <Widget>[
                    TextButton(
                      child: const Text("NO"),
                      onPressed: () {
                        returnToHome = false;
                        Navigator.of(context).pop();
                      },
                    ),
                    TextButton(
                      child: const Text("YES"),
                      onPressed: () {
                        returnToHome = true;
                        Navigator.of(context).pop();
                      },
                    ),
                  ],
                ),
              );
            }

            if (returnToHome) {
              Navigator.of(context).pop();
            }
          },
        ),
      // 
      ]
    );
  }

  FutureBuilder<bool> saveStatus(BuildContext context) {
    return FutureBuilder<bool>(
      future: _gameSavedSuccessfully,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Row(
            children: const <Widget>[
              Expanded(
                child: Text(
                  "Saving game...",
                  textAlign: TextAlign.center,
                ),
              ),
              CircularProgressIndicator(),
            ],
          );
        } else if (snapshot.hasError) {
          return Row(
            children: [
              Expanded(
                child: Text(
                  "Failed to save game: ${snapshot.error}",
                  textAlign: TextAlign.center,
                ),
              ),
              Icon(Icons.close),
            ],
          );
        } else if (snapshot.hasData && snapshot.data == true) {
          return Row(
            children: [
              Expanded(
                child: Text(
                  "Game saved successfully!",
                  textAlign: TextAlign.center,
                ),
              ),
              Icon(Icons.check),
            ],
          );
        } else {
          return Row(
            children: [
              Expanded(
                child: Text(
                  "Failed to save game.",
                  textAlign: TextAlign.center,
                ),
              ),
              Icon(Icons.close),
            ],
          );        
        }
      },
    );
  }
}

class _Night extends StatefulWidget {
  final Function(int) updateGamePhase;
  final FlutterTts flutterTts;

  const _Night({
    required this.updateGamePhase,
    required this.flutterTts,
  });

  @override
  State<StatefulWidget> createState() => _NightState();
}

class _NightState extends State<_Night> {
  int scriptIdx = 0;
  NightPhase nightPhase = NightPhase.start;
  List<(NightPhase, String, int)>? script;

  @override
  void initState() {
    super.initState();
    widget.flutterTts.setCompletionHandler(() {
      updateIndex();
    });

    script = getNightScript(
      numEvil[globalNumPlayers] ?? 2,
      globalRolesSelected["Merlin"],
      globalRolesSelected["Percival"],
      globalRolesSelected["Oberon"],
      globalRolesSelected["Mordred"],
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (scriptIdx == script!.length) {
      widget.updateGamePhase(1);
      return Text(
        "Night phase complete. Good luck on your quests!",
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      );
    }

    speak(script![scriptIdx].$2);
    return Text(
      script![scriptIdx].$2,
      style: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
      textAlign: TextAlign.center,
    );
  }
  
  Future<void> speak(String text) async {
    await widget.flutterTts.speak(text);
  }

  Future<void> updateIndex() async {
    await Future.delayed(Duration(seconds: script![scriptIdx].$3));

    setState(() {
      scriptIdx++;
    });
  }

}

// TODO: send game results to server
// time started, winner, numPlayers, special roles used (probably just as 'RoleName':'True/False'), whether each round suceeded/failed
// remember to send time as UTC!
Future<bool> trySave() async {
  return true;
  // final HttpResponse response;

  // if (response.statusCode == 201) {
  //   return true;
  // } else {
  //   final dynamic responseBody = jsonDecode(response.body);
  //   if (responseBody is Map<String, dynamic>) {
  //     final String errorMessage = responseBody['message'] ?? "Unknown error";
  //     throw Exception(errorMessage);
  //   } else {
  //     throw Exception("Unknown error");
  //   }
  // }

}