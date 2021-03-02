import {AfterContentInit, Component, DoCheck, OnChanges, OnInit} from '@angular/core';
import 'chartjs-plugin-streaming';
import {grpc} from '@improbable-eng/grpc-web';

// import { GreeterClient, ServiceError } from 'src/generated/greet/greet_pb_service';
// import { HelloRequest, HelloReply } from 'src/generated/greet/greet_pb';

import { Movies } from 'src/generated/movies/movies_pb_service';

import { MoviesClient, ServiceError } from 'src/generated/movies/movies_pb_service';
import { GetRequest, GetResponse, EmptyRequest, GetListResponse, WeatherData, InsertResponse } from 'src/generated/movies/movies_pb';
import { CountryModel } from './models/countryModel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements  OnInit, AfterContentInit{
  title = 'grpc-client';
  public countries: CountryModel[] = [];

  public dataForChart: number;

  response: any;
  name: number;

  datasets: any[] = [{
    label: 'Температурные данные установки №1',
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgba(54, 162, 235, 1)',
    fill: false,
    cubicInterpolationMode: 'monotone',
    data: []
  }];
  options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        type: 'realtime',
        realtime: {
          onRefresh: (chart: any) => {
            chart.data.datasets.forEach((dataset: any) => {
              dataset.data.push({
                x: Date.now(),
                y: 0 || this.getData()
              });
            });
          },
          delay: 2000
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'value',
          ticks: {
            min: -50,
            max: 50,
            steps: 100,
            stepValue: 100,
            beginAtZero: true,
            suggestedMin: -50,
            suggestedMax: 50,
            stepSize: 1300
          }
        }
      }]

    }
  };

  ngAfterContentInit(): void {
    console.log('ngAfterContentInit');
    console.log('getData - ', this.getData());
  }


  ngOnInit(): void {
    this.getData();
    this.getWeather();
    console.log('getData - ', this.getData());
  }
  getData(): any {
    const getEmptyRequest = new EmptyRequest();

    grpc.unary(Movies.GetEmpty, {
      request: getEmptyRequest,
      host: 'https://localhost:5001',
      onEnd: res => {
        const { status, statusMessage, headers, message, trailers } = res;
        if (status === grpc.Code.OK && message) {
          const result = message.toObject() as GetListResponse.AsObject;
          // console.log('Данные nameval для Установки 1 - ', result.data.moviesList[0].nameval);
          this.dataForChart = result.data.moviesList[0].nameval;
          console.log('Данные nameval для Установки 1 - ', this.dataForChart);
        }
      }
    });
    return this.dataForChart;
  }
  getWeather(): void{
    const getEmptyRequest = new EmptyRequest();
    grpc.invoke(Movies.GetWeatherStream, {
      request: getEmptyRequest,
      host: 'https://localhost:5001',
      onMessage: (message: WeatherData) => {
        console.log('Температурный данные: ', message.toObject().temperaturec);
      },
      onEnd: (code: grpc.Code, msg: string | undefined, trailers: grpc.Metadata) => {
        if (code === grpc.Code.OK) {
          console.log('Поток данных прекращен!');
        } else {
          console.log('hit an error', code, msg, trailers);
        }
      }
    });
  }
  onSend(): void {
    const client = new MoviesClient('https://localhost:5001');
    const req = new GetRequest();
    req.setId(+this.name);

    client.get(req, (err: ServiceError, response: GetResponse) => {
      if (err) {
        this.response = `Error: {err.message}`;
        return;
      }
      this.response = response.getData();
      console.log(this.response);
    });
  }

  onUpdate(): void {
    const client = new MoviesClient('https://localhost:5001');
    const req = new GetRequest();

    client.update(req, (err: ServiceError, response: InsertResponse) => {
      if (err) {
        this.response = `Error: {err.message}`;
        return;
      }
      this.response = response.getData();
      console.log(this.response);
      this.getData();
    });
  }
}
