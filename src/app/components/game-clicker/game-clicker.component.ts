import { Component, Input, OnInit } from '@angular/core';

import { Game } from '../../interfaces/game';
import { GameProcess } from '../../interfaces/game-process';
import { CurrentGameStoreService } from '../../services/current-game-store.service';
import { UserService } from '../../services/user.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-game-clicker',
  templateUrl: './game-clicker.component.html',
  styleUrls: ['./game-clicker.component.scss']
})
export class GameClickerComponent implements OnInit {
  @Input() username: string;
  game: Game;
  timeLeft: number;
  intervalId: number;
  isGameStarted = false;
  isGameFinished = false;
  clicksMade = 0;

  constructor(
    private currentGameStoreService: CurrentGameStoreService,
    private userService: UserService,
    private gameService: GameService
  ) {
  }

  ngOnInit(): void {
    this.currentGameStoreService.gameWatcher
      .subscribe((game: Game) => {
        if (game) {
          this.game = game;

          if (this.timeLeft !== 0) {
            this.timeLeft = this.gameService.getGameDuration(game.mode);
          }
        }
      }, (err) => console.error(err));

    this.currentGameStoreService.gameProcessWatcher
      .subscribe(({ isFinished, isStarted }: GameProcess) => {
        this.isGameStarted = isStarted;
        this.isGameFinished = isFinished;

        const isGameBeingReset = !isStarted && !isFinished;
        if (isGameBeingReset) {
          this.timeLeft = this.gameService.getGameDuration(this.game.mode);
          this.clicksMade = 0;
        }
      }, (err) => console.error(err));
  }

  playGame(): void {
    this.gameService.updateGameProcess({ isStarted: true });
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      if (!this.timeLeft) {
        clearInterval(this.intervalId);
        this.gameService.updateGameProcess({ isFinished: true });
        this.game.id = this.gameService.generateNewGameId();
        this.game.username = this.username;
        this.game.result = this.clicksMade;
        this.gameService.updateGameData(this.game);
        this.userService.updateUserGames(this.game);
      }
    }, 1000);
  }

  onClickCount(): void {
    this.clicksMade++;
  }
}
